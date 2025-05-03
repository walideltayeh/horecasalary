
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Cafe, DeletionLog } from '@/types';

/**
 * Hook for logging deletion events and retrieving deletion logs
 */
export const useDeleteLogger = () => {
  /**
   * Log a deletion event to the deletion_logs table via edge function
   */
  const logDeletion = async (
    entityType: string,
    entityId: string,
    deletedBy: string,
    entityData: Record<string, any>
  ): Promise<boolean> => {
    try {
      console.log(`Logging deletion of ${entityType} with ID: ${entityId} by ${deletedBy}`);
      
      // Validate required parameters
      if (!entityType || !entityId) {
        console.error("Missing required parameters for deletion logging");
        return false;
      }
      
      // Make sure we have the deletedBy parameter (user ID)
      if (!deletedBy) {
        console.error("Missing deletedBy parameter for deletion logging");
        return false;
      }

      // Ensure entityData is an object
      if (!entityData || typeof entityData !== 'object') {
        console.warn("Entity data is missing or invalid, using empty object");
        entityData = { id: entityId, note: "No data available" };
      }

      // Log the deletion directly to the deletion_logs table
      const { data, error } = await supabase
        .from('deletion_logs')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          deleted_by: deletedBy,
          entity_data: entityData
        });
      
      if (error) {
        console.error("Failed to log deletion directly:", error);
        
        // Try using the edge function as a fallback
        const functionResponse = await supabase.functions.invoke('safe_delete_cafe_related_data', {
          body: {
            logOnly: true,
            entityType,
            entityId,
            deletedBy,
            entityData
          }
        });
        
        if (functionResponse.error) {
          console.error("Failed to log deletion via edge function:", functionResponse.error);
          toast.error("Failed to log deletion event", {
            id: `log-error-${entityId}`,
            duration: 3000
          });
          return false;
        }
        
        console.log("Successfully logged deletion event via edge function:", functionResponse.data);
        return true;
      }
      
      console.log("Successfully logged deletion event directly to table");
      return true;
    } catch (err: any) {
      console.error("Error logging deletion:", err);
      return false;
    }
  };
  
  /**
   * Retrieves the deletion logs with optional filtering
   */
  const getDeletionLogs = async (
    entityType?: string, 
    entityId?: string, 
    userId?: string
  ): Promise<DeletionLog[]> => {
    try {
      console.log("Fetching deletion logs with filters:", { entityType, entityId, userId });
      
      let query = supabase
        .from('deletion_logs')
        .select('*')
        .order('deleted_at', { ascending: false });
      
      // Apply filters if provided
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      
      if (userId) {
        query = query.eq('deleted_by', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Failed to fetch deletion logs directly:", error);
        
        // Try using the edge function as a fallback
        const { data: functionData, error: functionError } = await supabase.functions.invoke('safe_delete_cafe_related_data', {
          body: {
            action: 'getLogs',
            entityType,
            entityId,
            userId
          }
        });
        
        if (functionError || !functionData) {
          console.error("Failed to fetch deletion logs via edge function:", functionError);
          return [];
        }
        
        console.log(`Retrieved ${functionData?.length || 0} deletion logs via edge function`);
        return mapDeletionLogs(functionData);
      }
      
      console.log(`Retrieved ${data?.length || 0} deletion logs directly from table`);
      return mapDeletionLogs(data || []);
    } catch (err) {
      console.error("Error fetching deletion logs:", err);
      return [];
    }
  };
  
  /**
   * Map deletion log data to the DeletionLog type
   */
  const mapDeletionLogs = (logs: any[]): DeletionLog[] => {
    return logs.map(log => ({
      id: log.id,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      deleted_by: log.deleted_by,
      deleted_at: log.deleted_at,
      entity_data: log.entity_data || {}
    }));
  };
  
  /**
   * Get a deleted cafe by ID
   */
  const getDeletedCafe = async (cafeId: string): Promise<Cafe | null> => {
    try {
      // First try direct query to the deletion_logs table
      const { data, error } = await supabase
        .from('deletion_logs')
        .select('*')
        .eq('entity_type', 'cafe')
        .eq('entity_id', cafeId)
        .order('deleted_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        console.error("Error getting deleted cafe directly:", error);
        
        // Fall back to using the edge function
        const functionResponse = await supabase.functions.invoke('safe_delete_cafe_related_data', {
          body: {
            action: 'getDeletedCafe',
            cafeId
          }
        });
        
        if (functionResponse.error || !functionResponse.data) {
          console.error("Error getting deleted cafe via edge function:", functionResponse.error);
          return null;
        }
        
        return mapCafeData(functionResponse.data);
      }
      
      return mapCafeData(data.entity_data);
    } catch (err) {
      console.error("Error getting deleted cafe:", err);
      return null;
    }
  };
  
  /**
   * Map cafe data from entity_data to Cafe type
   */
  const mapCafeData = (entityData: any): Cafe => {
    return {
      id: entityData.id || '',
      name: entityData.name || '',
      ownerName: entityData.owner_name || entityData.ownerName || '',
      ownerNumber: entityData.owner_number || entityData.ownerNumber || '',
      numberOfHookahs: entityData.number_of_hookahs || entityData.numberOfHookahs || 0,
      numberOfTables: entityData.number_of_tables || entityData.numberOfTables || 0,
      status: entityData.status || 'Pending',
      photoUrl: entityData.photo_url || entityData.photoUrl,
      latitude: entityData.latitude,
      longitude: entityData.longitude,
      governorate: entityData.governorate || '',
      city: entityData.city || '',
      createdAt: entityData.created_at || entityData.createdAt || '',
      createdBy: entityData.created_by || entityData.createdBy || ''
    };
  };
  
  return {
    logDeletion,
    getDeletionLogs,
    getDeletedCafe
  };
};
