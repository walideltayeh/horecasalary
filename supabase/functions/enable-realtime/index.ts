
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("enable-realtime function called");
    
    // Create a Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { table_name } = requestBody;
    console.log("Enabling realtime for table:", table_name);
    
    if (!table_name) {
      return new Response(
        JSON.stringify({ error: "Table name is required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Multiple methods to enable realtime
    // Try multiple approaches for maximum reliability
    try {
      // Method 1: Use direct SQL
      console.log("Method 1: Using direct SQL");
      const directSql = `
        ALTER TABLE public."${table_name}" REPLICA IDENTITY FULL;
        ALTER PUBLICATION supabase_realtime ADD TABLE public."${table_name}";
      `;
      
      const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', { 
        sql: directSql 
      });
      
      console.log("Direct SQL result:", sqlResult, sqlError);
      
      if (!sqlError) {
        return new Response(
          JSON.stringify({
            success: true,
            method: "direct_sql",
            table: table_name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Method 2: Try creating individual statements
      console.log("Method 2: Using separate statements");
      const replicaSql = `ALTER TABLE public."${table_name}" REPLICA IDENTITY FULL;`;
      const publicationSql = `ALTER PUBLICATION supabase_realtime ADD TABLE public."${table_name}";`;
      
      // Try replica identity first
      const { data: replicaResult, error: replicaError } = await supabase.rpc('execute_sql', {
        sql: replicaSql
      });
      
      console.log("Replica identity result:", replicaResult, replicaError);
      
      // Then try publication
      const { data: pubResult, error: pubError } = await supabase.rpc('execute_sql', {
        sql: publicationSql
      });
      
      console.log("Publication result:", pubResult, pubError);
      
      if (!pubError || pubError.message.includes('already exists')) {
        return new Response(
          JSON.stringify({
            success: true,
            method: "separate_statements",
            table: table_name,
            replica_result: replicaResult,
            pub_result: pubResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Method 3: Use the enable_realtime_for_table function
      console.log("Method 3: Using enable_realtime_for_table function");
      const { data: functionResult, error: functionError } = await supabase.rpc('enable_realtime_for_table', { 
        table_name 
      });
      
      console.log("Function result:", functionResult, functionError);
      
      if (!functionError) {
        return new Response(
          JSON.stringify({
            success: true,
            method: "rpc_function",
            table: table_name,
            result: functionResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // If we get here, all methods failed but we'll return a 200 anyway
      // to prevent cascading failures - the client can retry
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to enable realtime with all methods, please check server logs",
          table: table_name,
          errors: {
            sql: sqlError?.message,
            replica: replicaError?.message,
            pub: pubError?.message,
            function: functionError?.message
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
      
    } catch (error) {
      console.error("Unexpected error:", error);
      return new Response(
        JSON.stringify({ 
          error: typeof error === 'object' ? error.message : 'Unknown error',
          stack: typeof error === 'object' ? error.stack : undefined 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: typeof error === 'object' ? error.message : 'Unknown error',
        stack: typeof error === 'object' ? error.stack : undefined 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
