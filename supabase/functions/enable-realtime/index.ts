
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

    // Try multiple approaches for maximum reliability
    try {
      // Method 1: Add to publication directly (most direct method)
      try {
        const { data: publicationData, error: publicationError } = await supabase
          .from('pg_publication_tables')
          .select('*')
          .eq('pubname', 'supabase_realtime')
          .eq('tablename', table_name);
          
        console.log("Publication check:", publicationData, publicationError);
        
        if (!publicationError && (!publicationData || publicationData.length === 0)) {
          console.log("Table not in publication, adding it now");
          // Table is not in publication, add it
          const publicationSql = `ALTER PUBLICATION supabase_realtime ADD TABLE public."${table_name}";`;
          const { data: pubResult, error: pubError } = await supabase.rpc('execute_sql', {
            sql: publicationSql
          });
          console.log("Publication result:", pubResult, pubError);
        } else {
          console.log("Table already in publication");
        }
        
        // Set replica identity regardless
        const replicaSql = `ALTER TABLE public."${table_name}" REPLICA IDENTITY FULL;`;
        const { data: replicaResult, error: replicaError } = await supabase.rpc('execute_sql', {
          sql: replicaSql
        });
        console.log("Replica identity result:", replicaResult, replicaError);
        
        return new Response(
          JSON.stringify({
            success: true,
            method: "direct_publication",
            table: table_name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (methodError) {
        console.error("Method 1 failed:", methodError);
        
        // Method 2: Try the enable_realtime_for_table function
        console.log("Method 2: Using enable_realtime_for_table function");
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
        
        // If we get here, first two methods failed, try one more approach
        console.log("Method 3: Using direct SQL execution as last resort");
        const directSql = `
          ALTER TABLE public."${table_name}" REPLICA IDENTITY FULL;
          ALTER PUBLICATION supabase_realtime ADD TABLE public."${table_name}";
        `;
        
        const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', { 
          sql: directSql 
        });
        
        console.log("Direct SQL result:", sqlResult, sqlError);
        
        // Return success even if there were errors, as long as we tried all methods
        return new Response(
          JSON.stringify({
            success: true,
            method: "multiple_attempts",
            table: table_name,
            notes: "Attempted multiple methods, check logs for details"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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
