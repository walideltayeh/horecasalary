
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
    // Create a Supabase client
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

    // First, set REPLICA IDENTITY to FULL to ensure complete row data is available in change events
    try {
      const { data: alterResult, error: alterError } = await supabase.rpc(
        'execute_sql',
        { sql: `ALTER TABLE public."${table_name}" REPLICA IDENTITY FULL;` }
      );
      
      if (alterError) {
        console.error("Error setting REPLICA IDENTITY:", alterError);
        // Continue anyway - this may fail if already set
      } else {
        console.log("Set REPLICA IDENTITY to FULL for table", table_name);
      }
    } catch (alterErr) {
      console.error("Exception setting REPLICA IDENTITY:", alterErr);
      // Continue anyway
    }

    // Then add the table to the supabase_realtime publication
    try {
      // First check if the table is already in the publication
      const { data: checkData, error: checkError } = await supabase.rpc(
        'execute_sql',
        { 
          sql: `
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public'
          AND tablename = '${table_name}';
          ` 
        }
      );
      
      if (checkError) {
        console.error("Error checking publication:", checkError);
      } else if (!checkData || checkData.length === 0) {
        // Table is not in publication, add it
        const { data: addResult, error: addError } = await supabase.rpc(
          'execute_sql',
          { sql: `ALTER PUBLICATION supabase_realtime ADD TABLE public."${table_name}";` }
        );
        
        if (addError) {
          console.error("Error adding table to publication:", addError);
          return new Response(
            JSON.stringify({ error: addError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        } else {
          console.log("Added table to supabase_realtime publication:", table_name);
        }
      } else {
        console.log("Table", table_name, "is already in the supabase_realtime publication");
      }
    } catch (pubErr) {
      console.error("Exception adding table to publication:", pubErr);
      return new Response(
        JSON.stringify({ error: pubErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create a database function to execute SQL statements (if it doesn't exist)
    try {
      const { data: fnResult, error: fnError } = await supabase.rpc(
        'execute_sql',
        {
          sql: `
          CREATE OR REPLACE FUNCTION public.execute_sql(sql text) RETURNS jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $function$
          DECLARE
            result jsonb;
          BEGIN
            EXECUTE sql;
            result := '{"success": true}'::jsonb;
            RETURN result;
          EXCEPTION
            WHEN OTHERS THEN
              result := jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'code', SQLSTATE
              );
              RETURN result;
          END;
          $function$;
          `
        }
      );
      
      if (fnError) {
        console.error("Error creating execute_sql function:", fnError);
        // Continue anyway - this may fail if already exists
      } else {
        console.log("Created or updated execute_sql function");
      }
    } catch (fnErr) {
      console.error("Exception creating execute_sql function:", fnErr);
      // Continue anyway
    }

    console.log(`Realtime enabled for table ${table_name}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        table: table_name,
        message: "Realtime enabled successfully" 
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
});
