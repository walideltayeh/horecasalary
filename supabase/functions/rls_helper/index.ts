
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Create Supabase client with service role key
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  try {
    console.log("Creating helper functions and enabling realtime");
    
    // Create helper functions
    const createHelperFunctionsSql = `
      -- Create a function to execute arbitrary SQL securely
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
      
      -- Create a function to enable realtime for a specific table
      CREATE OR REPLACE FUNCTION public.enable_realtime_for_table(table_name text)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      BEGIN
        -- Set the replica identity to full for the specified table
        EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', table_name);
        
        -- Check if the table is already added to the realtime publication
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public'
          AND tablename = table_name
        ) THEN
          -- Add the table to the realtime publication
          EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', table_name);
        END IF;
        
        RETURN true;
      END;
      $function$;
    `;

    // Execute the SQL to create helper functions
    const { data: helperData, error: helperError } = await supabase.rpc('execute_sql', { 
      sql: createHelperFunctionsSql 
    });
    
    if (helperError) {
      console.error("Error creating helper functions:", helperError);
      // Continue anyway as they might already exist
    } else {
      console.log("Helper functions created or already exist:", helperData);
    }
    
    // Enable realtime for important tables
    const tables = ['cafes', 'cafe_surveys', 'brand_sales'];
    const results = [];
    
    for (const table of tables) {
      try {
        // Call the function we just created
        const { data, error } = await supabase.rpc('enable_realtime_for_table', { 
          table_name: table 
        });
        
        if (error) {
          console.error(`Error enabling realtime for table ${table}:`, error);
          results.push({
            table,
            success: false,
            error: error.message
          });
        } else {
          console.log(`Realtime enabled for ${table}:`, data);
          results.push({
            table,
            success: true
          });
        }
      } catch (err) {
        console.error(`Error enabling realtime for table ${table}:`, err);
        results.push({
          table,
          success: false,
          error: err.message || 'Unknown error'
        });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Helper functions created and realtime enabled",
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
