
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
    // Extract request data with proper validation
    const requestData = await req.json();
    console.log("EDGE: Request data received:", requestData);
    
    const { 
      logOnly, 
      entityType, 
      entityId, 
      deletedBy, 
      entityData, 
      action, 
      cafeId, 
      userId 
    } = requestData;
    
    // HANDLE LOG DELETION
    if (logOnly === true) {
      console.log("EDGE: Logging deletion only");
      
      if (!entityType || !entityId || !deletedBy) {
        console.error("EDGE: Missing required parameters for deletion logging");
        return new Response(
          JSON.stringify({ error: "Missing required parameters for deletion logging" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      const { data, error } = await supabase
        .from('deletion_logs')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          deleted_by: deletedBy,
          entity_data: entityData || {}
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
      console.log("EDGE: Getting deletion logs", { entityType, entityId, userId });
      let query = supabase
        .from('deletion_logs')
        .select('*');
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      
      // Add filtering by userId (deleted_by field)
      if (userId) {
        console.log("EDGE: Filtering logs by user ID:", userId);
        query = query.eq('deleted_by', userId);
      }
      
      const { data, error } = await query.order('deleted_at', { ascending: false });
      
      if (error) {
        console.error("EDGE: Failed to get deletion logs:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log(`EDGE: Returning ${data?.length || 0} deletion logs`);
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
    
    // HANDLE FULL DELETION
    // If we reach here, this is a full deletion request
    console.log("EDGE: Attempting to delete cafe and related data");
    
    // First validate that we have all required parameters
    // If cafeId is provided but not entityType/entityId, use cafeId as entityId
    const finalEntityId = entityId || cafeId;
    const finalEntityType = entityType || 'cafe';
    
    if (!finalEntityId) {
      console.error("EDGE: Missing required cafeId/entityId for deletion");
      return new Response(
        JSON.stringify({ error: "Missing required cafeId for deletion" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!deletedBy) {
      console.error("EDGE: Missing deletedBy for deletion tracking");
      return new Response(
        JSON.stringify({ error: "Missing required deletedBy for deletion tracking" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // If entityData is not provided, try to fetch cafe data
    let finalEntityData = entityData;
    
    if (!finalEntityData) {
      console.log(`EDGE: No entity data provided, fetching cafe data for ${finalEntityId}`);
      const { data: fetchedCafe, error: fetchError } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', finalEntityId)
        .single();
        
      if (fetchError || !fetchedCafe) {
        console.error("EDGE: Error fetching cafe data:", fetchError);
        // Continue with deletion but won't have data for logging
        finalEntityData = { id: finalEntityId, note: "Cafe data not available" };
      } else {
        finalEntityData = fetchedCafe;
      }
    }

    try {
      // Log the deletion FIRST to ensure we have a record even if deletion fails
      console.log("EDGE: Logging deletion before deleting data");
      const { error: logError } = await supabase
        .from('deletion_logs')
        .insert({
          entity_type: finalEntityType,
          entity_id: finalEntityId,
          deleted_by: deletedBy,
          entity_data: finalEntityData || {}
        });

      const logSuccess = !logError;
      console.log("EDGE: Deletion log created:", logSuccess);
      
      if (logError) {
        console.error("EDGE: Failed to log deletion:", logError);
        // Continue with deletion even if logging fails
      }

      // 1. Delete related records in brand_sales
      console.log("EDGE: Deleting brand_sales records");
      const { error: brandSalesError } = await supabase
        .from('brand_sales')
        .delete()
        .eq('survey_id', finalEntityId);

      if (brandSalesError) {
        console.error("EDGE: Error deleting brand_sales:", brandSalesError);
      }

      // 2. Delete related records in cafe_surveys
      console.log("EDGE: Deleting cafe_surveys records");
      const { error: cafeSurveysError } = await supabase
        .from('cafe_surveys')
        .delete()
        .eq('cafe_id', finalEntityId);

      if (cafeSurveysError) {
        console.error("EDGE: Error deleting cafe_surveys:", cafeSurveysError);
      }

      // 3. Finally, delete the cafe
      console.log("EDGE: Deleting cafe");
      const { error: cafeError } = await supabase
        .from('cafes')
        .delete()
        .eq('id', finalEntityId);

      if (cafeError) {
        console.error("EDGE: Error deleting cafe:", cafeError);
        return new Response(
          JSON.stringify({ 
            error: `Failed to delete cafe: ${cafeError.message}`,
            logged: logSuccess
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // If all operations were successful
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Cafe and related data deleted successfully",
          logged: logSuccess
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } catch (error: any) {
      console.error("EDGE: Unexpected error during deletion:", error);
      return new Response(
        JSON.stringify({ error: `Unexpected error during deletion: ${error.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Default response if no specific action matched (though we shouldn't reach here)
    return new Response(
      JSON.stringify({ error: "Invalid action specified" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
    
  } catch (error: any) {
    console.error("EDGE: Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
