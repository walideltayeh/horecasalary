
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
    
    // Parse the request body
    let cafeId;
    try {
      const body = await req.json();
      cafeId = body.cafeId;
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    if (!cafeId) {
      console.error("Missing cafeId parameter");
      return new Response(
        JSON.stringify({ error: "Missing cafeId parameter" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    console.log(`Starting deletion process for cafe ID: ${cafeId}`);
    
    // Get the currently authenticated user to check permissions
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
    
    if (authError) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication error", details: authError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }
    
    if (!session) {
      console.error("No active session found");
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }
    
    // Get cafe to check ownership and store for logging
    const { data: cafe, error: cafeError } = await supabaseClient
      .from('cafes')
      .select('*')
      .eq('id', cafeId)
      .single();
    
    if (cafeError) {
      console.error("Error fetching cafe:", cafeError);
      return new Response(
        JSON.stringify({ error: cafeError.message, step: "fetching_cafe_details" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }
    
    // Get the user's role to check if they are an admin
    const { data: userInfo, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      console.error("Error fetching user role:", userError);
      return new Response(
        JSON.stringify({ error: userError.message, step: "fetching_user_role" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    // Check if user has permission to delete this cafe
    const isAdmin = userInfo?.role === 'admin';
    const isOwner = cafe.created_by === session.user.id;
    
    if (!isAdmin && !isOwner) {
      console.error("User does not have permission to delete this cafe");
      return new Response(
        JSON.stringify({ error: "Permission denied. You can only delete cafes you created." }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }
    
    // Log the deletion before performing the actual deletion
    const { data: logData, error: logError } = await supabaseClient
      .from('deletion_logs')
      .insert({
        entity_type: 'cafe',
        entity_id: cafeId,
        deleted_by: session.user.id,
        entity_data: cafe
      });
      
    if (logError) {
      console.error("Error logging deletion:", logError);
      // Continue with deletion even if logging fails
      console.warn("Continuing with deletion despite logging error");
    } else {
      console.log("Successfully logged deletion event before deleting cafe");
    }
    
    // Get all surveys related to this cafe
    const { data: surveys, error: surveyError } = await supabaseClient
      .from('cafe_surveys')
      .select('id')
      .eq('cafe_id', cafeId);
      
    if (surveyError) {
      console.error("Error fetching related surveys:", surveyError);
      return new Response(
        JSON.stringify({ error: surveyError.message, step: "fetching_surveys" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    // If there are surveys, delete related brand_sales first
    if (surveys && surveys.length > 0) {
      const surveyIds = surveys.map(s => s.id);
      console.log(`Deleting ${surveyIds.length} related survey records and associated brand sales`);
      
      // Delete brand_sales linked to these surveys
      const { error: brandSalesError } = await supabaseClient
        .from('brand_sales')
        .delete()
        .in('survey_id', surveyIds);
        
      if (brandSalesError) {
        console.error("Error deleting brand_sales:", brandSalesError);
        return new Response(
          JSON.stringify({ error: brandSalesError.message, step: "deleting_brand_sales" }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      // Delete surveys
      const { error: deleteSurveysError } = await supabaseClient
        .from('cafe_surveys')
        .delete()
        .eq('cafe_id', cafeId);
        
      if (deleteSurveysError) {
        console.error("Error deleting surveys:", deleteSurveysError);
        return new Response(
          JSON.stringify({ error: deleteSurveysError.message, step: "deleting_surveys" }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
    } else {
      console.log(`No surveys found for cafe ${cafeId}`);
    }
    
    // Finally delete the cafe itself
    const { error: deleteCafeError } = await supabaseClient
      .from('cafes')
      .delete()
      .eq('id', cafeId);
      
    if (deleteCafeError) {
      console.error("Error deleting cafe:", deleteCafeError);
      return new Response(
        JSON.stringify({ error: deleteCafeError.message, step: "deleting_cafe" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    console.log(`Successfully deleted cafe ${cafeId} and all related data`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cafe ${cafeId} and all related data deleted successfully`,
        logged: logError ? false : true,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Unexpected error in safe_delete_cafe_related_data:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
