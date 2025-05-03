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
    // Extract request data
    const { logOnly, entityType, entityId, deletedBy, entityData, action, cafeId } = await req.json()
    
    // HANDLE LOG DELETION
    if (logOnly === true) {
      console.log("EDGE: Logging deletion only");
      
      const { data, error } = await supabase
        .from('deletion_logs')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          deleted_by: deletedBy,
          entity_data: entityData
        });
        
      if (error) {
        console.error("EDGE: Failed to log deletion:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: "Deletion logged successfully" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // HANDLE GET LOGS ACTION
    if (action === 'getLogs') {
      console.log("EDGE: Getting deletion logs");
      let query = supabase
        .from('deletion_logs')
        .select('*');
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      
      const { data, error } = await query.order('deleted_at', { ascending: false });
      
      if (error) {
        console.error("EDGE: Failed to get deletion logs:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // HANDLE GET DELETED CAFE ACTION
    if (action === 'getDeletedCafe' && cafeId) {
      console.log(`EDGE: Getting deleted cafe with ID ${cafeId}`);
      
      const { data, error } = await supabase
        .from('deletion_logs')
        .select('*')
        .eq('entity_type', 'cafe')
        .eq('entity_id', cafeId)
        .order('deleted_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        console.error("EDGE: Failed to get deleted cafe:", error);
        return new Response(
          JSON.stringify({ error: error?.message || "Cafe not found" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      return new Response(
        JSON.stringify(data.entity_data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // HANDLE FULL DELETION (This is the existing functionality)
    // Logic for actually deleting cafe and related data
    console.log("EDGE: Attempting to delete cafe and related data");

    // Check if required parameters are provided
    if (!entityType || !entityId || !deletedBy) {
      console.error("EDGE: Missing required parameters for deletion");
      return new Response(
        JSON.stringify({ error: "Missing required parameters for deletion" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    try {
      // 1. Delete related records in brand_sales
      const { error: brandSalesError } = await supabase
        .from('brand_sales')
        .delete()
        .eq('survey_id', entityId);

      if (brandSalesError) {
        console.error("EDGE: Error deleting brand_sales:", brandSalesError);
        return new Response(
          JSON.stringify({ error: `Failed to delete brand_sales: ${brandSalesError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // 2. Delete related records in cafe_surveys
      const { error: cafeSurveysError } = await supabase
        .from('cafe_surveys')
        .delete()
        .eq('cafe_id', entityId);

      if (cafeSurveysError) {
        console.error("EDGE: Error deleting cafe_surveys:", cafeSurveysError);
        return new Response(
          JSON.stringify({ error: `Failed to delete cafe_surveys: ${cafeSurveysError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // 3. Log the deletion event
      const { error: logError } = await supabase
        .from('deletion_logs')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          deleted_by: deletedBy,
          entity_data: entityData
        });

      if (logError) {
        console.error("EDGE: Failed to log deletion:", logError);
        return new Response(
          JSON.stringify({ error: `Failed to log deletion: ${logError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // 4. Finally, delete the cafe
      const { error: cafeError } = await supabase
        .from('cafes')
        .delete()
        .eq('id', entityId);

      if (cafeError) {
        console.error("EDGE: Error deleting cafe:", cafeError);
        return new Response(
          JSON.stringify({ error: `Failed to delete cafe: ${cafeError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // If all operations were successful
      return new Response(
        JSON.stringify({ success: true, message: "Cafe and related data deleted successfully" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } catch (error) {
      console.error("EDGE: Unexpected error during deletion:", error);
      return new Response(
        JSON.stringify({ error: `Unexpected error during deletion: ${error.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Default response if no specific action matched
    return new Response(
      JSON.stringify({ error: "Invalid action specified" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
    
  } catch (error) {
    console.error("EDGE: Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
