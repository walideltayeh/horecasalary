
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Response helper functions
const errorResponse = (message: string, status = 400) => {
  console.error(`EDGE: Error - ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  );
}

const successResponse = (data: any, status = 200) => {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  );
}

// Create Supabase client (moved into a function to separate concerns)
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// Log deletion function
const logDeletion = async (supabase: ReturnType<typeof createClient>, entityType: string, entityId: string, deletedBy: string, entityData: any) => {
  console.log(`EDGE: Logging deletion - Type: ${entityType}, ID: ${entityId}, By: ${deletedBy}`);
  
  try {
    const { error } = await supabase
      .from('deletion_logs')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        deleted_by: deletedBy,
        entity_data: entityData || {}
      });
      
    if (error) {
      console.error("EDGE: Failed to log deletion:", error);
      return false;
    }
    
    console.log("EDGE: Deletion logged successfully");
    return true;
  } catch (err) {
    console.error("EDGE: Exception logging deletion:", err);
    return false;
  }
}

// Fetch cafe data function
const fetchCafeData = async (supabase: ReturnType<typeof createClient>, cafeId: string) => {
  console.log(`EDGE: Fetching cafe data for ${cafeId}`);
  
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('id', cafeId)
    .single();
    
  if (error || !data) {
    console.error("EDGE: Error fetching cafe data:", error);
    return null;
  }
  
  return data;
}

// Delete related brand sales function
const deleteBrandSales = async (supabase: ReturnType<typeof createClient>, entityId: string) => {
  console.log(`EDGE: Deleting brand_sales for ${entityId}`);
  const { error } = await supabase
    .from('brand_sales')
    .delete()
    .eq('survey_id', entityId);

  if (error) {
    console.error("EDGE: Error deleting brand_sales:", error);
    return false;
  }
  return true;
}

// Delete related cafe surveys function
const deleteCafeSurveys = async (supabase: ReturnType<typeof createClient>, entityId: string) => {
  console.log(`EDGE: Deleting cafe_surveys for ${entityId}`);
  const { error } = await supabase
    .from('cafe_surveys')
    .delete()
    .eq('cafe_id', entityId);

  if (error) {
    console.error("EDGE: Error deleting cafe_surveys:", error);
    return false;
  }
  return true;
}

// Delete cafe function
const deleteCafe = async (supabase: ReturnType<typeof createClient>, entityId: string) => {
  console.log(`EDGE: Deleting cafe ${entityId}`);
  const { error } = await supabase
    .from('cafes')
    .delete()
    .eq('id', entityId);

  if (error) {
    console.error("EDGE: Error deleting cafe:", error);
    return false;
  }
  return true;
}

// Get deletion logs function
const getDeletionLogs = async (supabase: ReturnType<typeof createClient>, params: { 
  entityType?: string, 
  entityId?: string, 
  userId?: string 
}) => {
  const { entityType, entityId, userId } = params;
  console.log("EDGE: Getting deletion logs", { entityType, entityId, userId });
  
  let query = supabase.from('deletion_logs').select('*');
  
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
    return null;
  }
  
  console.log(`EDGE: Returning ${data?.length || 0} deletion logs`);
  return data;
}

// Get deleted cafe function
const getDeletedCafe = async (supabase: ReturnType<typeof createClient>, cafeId: string) => {
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
    return null;
  }
  
  return data.entity_data;
}

// Full deletion process function
const performFullDeletion = async (
  supabase: ReturnType<typeof createClient>, 
  finalEntityId: string, 
  finalEntityType: string,
  deletedBy: string,
  finalEntityData: any
) => {
  // Log the deletion FIRST to ensure we have a record even if deletion fails
  console.log("EDGE: Logging deletion before deleting data");
  const logSuccess = await logDeletion(
    supabase, 
    finalEntityType, 
    finalEntityId, 
    deletedBy, 
    finalEntityData
  );

  console.log("EDGE: Deletion log created:", logSuccess);
  
  // 1. Delete related records in brand_sales
  const brandSalesDeleted = await deleteBrandSales(supabase, finalEntityId);

  // 2. Delete related records in cafe_surveys
  const surveysDeleted = await deleteCafeSurveys(supabase, finalEntityId);

  // 3. Finally, delete the cafe
  const cafeDeleted = await deleteCafe(supabase, finalEntityId);

  if (!cafeDeleted) {
    return { success: false, message: "Failed to delete cafe", logged: logSuccess };
  }

  // If all operations were successful
  return { 
    success: true, 
    message: "Cafe and related data deleted successfully",
    logged: logSuccess 
  };
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Create Supabase client
  const supabase = getSupabaseClient();
  
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
        return errorResponse("Missing required parameters for deletion logging");
      }
      
      const result = await logDeletion(supabase, entityType, entityId, deletedBy, entityData);
      
      if (!result) {
        return errorResponse("Failed to log deletion", 500);
      }
      
      return successResponse({ success: true, message: "Deletion logged successfully" });
    }
    
    // HANDLE GET LOGS ACTION
    if (action === 'getLogs') {
      const logs = await getDeletionLogs(supabase, { entityType, entityId, userId });
      
      if (logs === null) {
        return errorResponse("Failed to get deletion logs", 500);
      }
      
      return successResponse(logs);
    }
    
    // HANDLE GET DELETED CAFE ACTION
    if (action === 'getDeletedCafe' && cafeId) {
      const deletedCafe = await getDeletedCafe(supabase, cafeId);
      
      if (deletedCafe === null) {
        return errorResponse("Cafe not found", 404);
      }
      
      return successResponse(deletedCafe);
    }
    
    // HANDLE FULL DELETION
    // If we reach here, this is a full deletion request
    console.log("EDGE: Attempting to delete cafe and related data");
    
    // First validate that we have all required parameters
    // If cafeId is provided but not entityType/entityId, use cafeId as entityId
    const finalEntityId = entityId || cafeId;
    const finalEntityType = entityType || 'cafe';
    
    if (!finalEntityId) {
      return errorResponse("Missing required cafeId/entityId for deletion");
    }
    
    if (!deletedBy) {
      return errorResponse("Missing deletedBy for deletion tracking");
    }
    
    // If entityData is not provided, try to fetch cafe data
    let finalEntityData = entityData;
    
    if (!finalEntityData) {
      console.log(`EDGE: No entity data provided, fetching cafe data for ${finalEntityId}`);
      finalEntityData = await fetchCafeData(supabase, finalEntityId);
      
      if (!finalEntityData) {
        // Continue with deletion but won't have data for logging
        finalEntityData = { id: finalEntityId, note: "Cafe data not available" };
      }
    }

    try {
      const result = await performFullDeletion(
        supabase, 
        finalEntityId, 
        finalEntityType, 
        deletedBy, 
        finalEntityData
      );

      return successResponse(result, result.success ? 200 : 500);
    } catch (error: any) {
      return errorResponse(`Unexpected error during deletion: ${error.message}`, 500);
    }
  } catch (error: any) {
    return errorResponse(error.message || 'Unknown error', 500);
  }
});
