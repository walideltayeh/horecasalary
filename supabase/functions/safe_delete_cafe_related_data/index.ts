
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { cafeId } = await req.json();
    
    // Get all surveys related to this cafe
    const { data: surveys, error: surveyError } = await supabaseClient
      .from('cafe_surveys')
      .select('id')
      .eq('cafe_id', cafeId);
      
    if (surveyError) {
      console.error("Error fetching related surveys:", surveyError);
      throw surveyError;
    }
    
    // If there are surveys, delete related brand_sales first
    if (surveys && surveys.length > 0) {
      const surveyIds = surveys.map(s => s.id);
      
      // Delete brand_sales linked to these surveys
      const { error: brandSalesError } = await supabaseClient
        .from('brand_sales')
        .delete()
        .in('survey_id', surveyIds);
        
      if (brandSalesError) {
        console.error("Error deleting brand_sales:", brandSalesError);
      }
    }
    
    // Delete surveys
    const { error: deleteSurveysError } = await supabaseClient
      .from('cafe_surveys')
      .delete()
      .eq('cafe_id', cafeId);
      
    if (deleteSurveysError) {
      console.error("Error deleting surveys:", deleteSurveysError);
    }
    
    // Finally delete the cafe itself
    const { error: deleteCafeError } = await supabaseClient
      .from('cafes')
      .delete()
      .eq('id', cafeId);
      
    if (deleteCafeError) {
      console.error("Error deleting cafe:", deleteCafeError);
      throw deleteCafeError;
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error in safe_delete_cafe_related_data:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
