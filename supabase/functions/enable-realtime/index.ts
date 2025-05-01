
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
      // Method 1: Use direct SQL execution with the rpc function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('enable_realtime_for_table', { 
        table_name 
      });
      
      console.log("RPC function result:", rpcResult, rpcError);
      
      // Method 2: Use direct SQL execution as fallback approach
      const directSql = `
        ALTER TABLE public."${table_name}" REPLICA IDENTITY FULL;
        ALTER PUBLICATION supabase_realtime ADD TABLE public."${table_name}";
      `;
      
      const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', { 
        sql: directSql 
      });
      
      console.log("Direct SQL result:", sqlResult, sqlError);
      
      // Success if either method worked
      const success = !rpcError || !sqlError;
      
      // Return success response
      return new Response(
        JSON.stringify({
          success,
          table: table_name,
          rpc_result: rpcResult,
          sql_result: sqlResult,
          rpc_error: rpcError ? rpcError.message : null,
          sql_error: sqlError ? sqlError.message : null,
          message: "Used multiple methods to ensure realtime is enabled"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: success ? 200 : 500 }
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      return new Response(
        JSON.stringify({ 
          error: typeof error === 'object' ? error.message : 'Unknown error',
          stack: typeof error === 'object' ? error.stack : undefined,
          table: table_name
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
