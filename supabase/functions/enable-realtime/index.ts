
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

    // First create database helper functions if they don't exist
    try {
      const { error: execFnError } = await supabase.rpc('execute_sql', {
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
      }).catch(e => {
        console.log("Could not create execute_sql function, might already exist:", e.message);
        return { error: e };
      });

      if (execFnError) {
        console.log("Error creating execute_sql function, trying direct SQL...");
        
        // Direct SQL execution through PostgreSQL REST
        const { error: sqlError } = await supabase.from('_direct_sql').select('*', {
          head: true,
          query: {
            query: `
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
        }).catch(e => {
          console.log("Direct SQL also failed:", e.message);
          return { error: e };
        });
        
        console.log("Direct SQL execution result:", sqlError || "Success");
      }
    } catch (e) {
      console.log("Error setting up helper functions:", e.message);
      // Continue anyway, as the functions might already exist
    }

    // 1. Set REPLICA IDENTITY to FULL
    try {
      const { error: replicaError } = await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE public."${table_name}" REPLICA IDENTITY FULL;`
      }).catch(e => {
        console.log("Could not set REPLICA IDENTITY, continuing:", e.message);
        return { error: e };
      });
      
      if (replicaError) {
        console.log("Error setting REPLICA IDENTITY, but proceeding anyway:", replicaError);
      } else {
        console.log("REPLICA IDENTITY set to FULL successfully");
      }
    } catch (e) {
      console.log("Exception setting REPLICA IDENTITY:", e.message);
      // Continue anyway
    }

    // 2. Add table to publication
    try {
      // First check if table exists in publication
      const { data: checkData, error: checkError } = await supabase.rpc('execute_sql', {
        sql: `
          SELECT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public'
            AND tablename = '${table_name}'
          ) as exists;
        `
      }).catch(e => {
        console.log("Could not check publication, continuing:", e.message);
        return { data: null, error: e };
      });
      
      console.log("Check publication result:", checkData, checkError);
      
      // If check failed or table not in publication, try to add it
      if (checkError || !checkData || !checkData.exists) {
        console.log("Table not in publication or check failed, adding it");
        
        const { error: addError } = await supabase.rpc('execute_sql', {
          sql: `ALTER PUBLICATION supabase_realtime ADD TABLE public."${table_name}";`
        }).catch(e => {
          console.log("Could not add to publication, continuing:", e.message);
          return { error: e };
        });
        
        if (addError) {
          console.log("Error adding to publication, trying alternative approach:", addError);
          
          // If that fails, try direct approach through RPC
          const { error: directError } = await supabase.rpc('enable_realtime_for_table', { 
            table_name 
          }).catch(e => {
            console.log("Could not enable realtime directly, continuing:", e.message);
            return { error: e };
          });
          
          if (directError) {
            console.log("Direct approach also failed:", directError);
          } else {
            console.log("Successfully enabled realtime directly via RPC");
          }
        } else {
          console.log("Successfully added to publication");
        }
      } else {
        console.log("Table already in publication");
      }
    } catch (e) {
      console.log("Exception adding table to publication:", e.message);
    }

    // 3. Final verification
    let verificationStatus = "Unknown";
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: `
          SELECT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public'
            AND tablename = '${table_name}'
          ) as is_in_publication;
        `
      });
      
      if (error) {
        console.log("Error verifying publication status:", error);
        verificationStatus = "Verification failed";
      } else if (data && data.is_in_publication) {
        console.log("Verification successful - table is in publication");
        verificationStatus = "Verified successful";
      } else {
        console.log("Verification shows table is NOT in publication");
        verificationStatus = "Not in publication";
      }
    } catch (e) {
      console.log("Exception during verification:", e);
      verificationStatus = "Verification error";
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        table: table_name,
        message: "Realtime setup attempted",
        verificationStatus
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
