
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
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

    // Execute the SQL command to enable realtime for the table
    const { data, error } = await supabase.rpc('enable_realtime_for_table', { table_name });
    
    if (error) {
      console.error("Error enabling realtime:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Realtime enabled for table ${table_name}:`, data);
    return new Response(
      JSON.stringify({ success: true, table: table_name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
