
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

    // Check if function exists, if not create it
    try {
      // Execute the SQL to enable realtime for the table directly
      const { data, error } = await supabase.rpc('enable_realtime_for_table', { 
        table_name 
      });
      
      console.log("RPC result:", data, error);
      
      if (error) {
        console.error("Error enabling realtime via RPC:", error);
        
        // Fallback: Try direct SQL execution
        const { data: directData, error: directError } = await supabase.rpc('execute_sql', {
          sql: `
            -- Set the replica identity to full for the specified table
            ALTER TABLE public."${table_name}" REPLICA IDENTITY FULL;
            
            -- Add the table to the realtime publication
            ALTER PUBLICATION supabase_realtime ADD TABLE public."${table_name}";
          `
        });
        
        if (directError) {
          console.error("Error with direct SQL execution:", directError);
          return new Response(
            JSON.stringify({ 
              error: directError.message,
              message: "Failed to enable realtime via direct SQL"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        console.log("Direct execution result:", directData);
        return new Response(
          JSON.stringify({ 
            success: true, 
            method: "direct_sql",
            table: table_name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          method: "rpc",
          table: table_name
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
