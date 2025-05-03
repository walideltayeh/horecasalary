
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

// Create Supabase client
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
    // Validate inputs
    if (!entityType || !entityId || !deletedBy) {
      console.error("EDGE: Missing required parameters for deletion logging");
      return false;
    }
    
    // Ensure entityData is an object
    const safeEntityData = entityData || { id: entityId };
    
    // Insert log entry
    const { error } = await supabase
      .from('deletion_logs')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        deleted_by: deletedBy,
        entity_data: safeEntityData
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

// Delete related records in tables
const deleteRelatedRecords = async (supabase: ReturnType<typeof createClient>, cafeId: string) => {
  // 1. Delete related records in brand_sales through surveys
  const { data: surveyIds, error: surveyError } = await supabase
    .from('cafe_surveys')
    .select('id')
    .eq('cafe_id', cafeId);
  
  if (!surveyError && surveyIds && surveyIds.length > 0) {
    const surveyIdArray = surveyIds.map(s => s.id);
    console.log(`EDGE: Found ${surveyIdArray.length} surveys to delete for cafe ${cafeId}`);
    
    const { error: brandSalesError } = await supabase
      .from('brand_sales')
      .delete()
      .in('survey_id', surveyIdArray);
    
    if (brandSalesError) {
      console.error("EDGE: Error deleting brand_sales:", brandSalesError);
    }
  }
  
  // 2. Delete related cafe surveys
  const { error: cafesSurveyError } = await supabase
    .from('cafe_surveys')
    .delete()
    .eq('cafe_id', cafeId);
  
  if (cafesSurveyError) {
    console.error("EDGE: Error deleting cafe_surveys:", cafesSurveyError);
    return false;
  }
  
  return true;
}

// Delete cafe function
const deleteCafe = async (supabase: ReturnType<typeof createClient>, cafeId: string) => {
  console.log(`EDGE: Deleting cafe ${cafeId}`);
  const { error } = await supabase
    .from('cafes')
    .delete()
    .eq('id', cafeId);

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
  
  let query = supabase
    .from('deletion_logs')
    .select('*')
    .order('deleted_at', { ascending: false });
  
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
  
  const { data, error } = await query;
  
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
  
  // First delete related records
  const relatedDeleted = await deleteRelatedRecords(supabase, finalEntityId);
  
  if (!relatedDeleted) {
    return { 
      success: false, 
      message: "Failed to delete related records", 
      logged: logSuccess 
    };
  }

  // Finally, delete the cafe
  const cafeDeleted = await deleteCafe(supabase, finalEntityId);

  if (!cafeDeleted) {
    return { 
      success: false, 
      message: "Failed to delete cafe", 
      logged: logSuccess 
    };
  }

  // If all operations were successful
  return { 
    success: true, 
    message: "Cafe and related data deleted successfully",
    logged: logSuccess 
  };
}

// Handle logging only request
const handleLoggingRequest = async (supabase: ReturnType<typeof createClient>, requestData: any) => {
  const { entityType, entityId, deletedBy, entityData } = requestData;
  
  if (!entityType || !entityId || !deletedBy) {
    return errorResponse("Missing required parameters for deletion logging");
  }
  
  const result = await logDeletion(supabase, entityType, entityId, deletedBy, entityData);
  
  if (!result) {
    return errorResponse("Failed to log deletion", 500);
  }
  
  return successResponse({ success: true, message: "Deletion logged successfully" });
}

// Handle get logs request
const handleGetLogsRequest = async (supabase: ReturnType<typeof createClient>, requestData: any) => {
  const { entityType, entityId, userId } = requestData;
  const logs = await getDeletionLogs(supabase, { entityType, entityId, userId });
  
  if (logs === null) {
    return errorResponse("Failed to get deletion logs", 500);
  }
  
  return successResponse(logs);
}

// Handle get deleted cafe request
const handleGetDeletedCafeRequest = async (supabase: ReturnType<typeof createClient>, cafeId: string) => {
  const deletedCafe = await getDeletedCafe(supabase, cafeId);
  
  if (deletedCafe === null) {
    return errorResponse("Cafe not found", 404);
  }
  
  return successResponse(deletedCafe);
}

// Handle full deletion request 
const handleFullDeletionRequest = async (supabase: ReturnType<typeof createClient>, requestData: any) => {
  const { entityId, cafeId, entityType, deletedBy, entityData } = requestData;
  
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
    
    // Handle different types of requests
    if (requestData.logOnly === true) {
      return await handleLoggingRequest(supabase, requestData);
    }
    
    if (requestData.action === 'getLogs') {
      return await handleGetLogsRequest(supabase, requestData);
    }
    
    if (requestData.action === 'getDeletedCafe' && requestData.cafeId) {
      return await handleGetDeletedCafeRequest(supabase, requestData.cafeId);
    }
    
    // Handle full deletion request (default action)
    return await handleFullDeletionRequest(supabase, requestData);
    
  } catch (error: any) {
    return errorResponse(error.message || 'Unknown error', 500);
  }
});
