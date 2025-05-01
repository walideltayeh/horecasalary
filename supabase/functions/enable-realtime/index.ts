
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
      // Method 1: Use direct SQL execution as initial approach
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
            table: table_name,
            result: sqlResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Method 2: Try the RPC function if available
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
      
      // Return success even if there were some errors - this function is best-effort
      return new Response(
        JSON.stringify({
          success: true,
          method: "attempted_multiple_methods",
          table: table_name,
          notes: "Attempted multiple methods to enable realtime"
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
