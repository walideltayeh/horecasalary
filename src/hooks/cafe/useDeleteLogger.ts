
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
      
      const { data, error } = await invokeLogDeletionFunction({
        logOnly: true,
        entityType,
        entityId,
        deletedBy,
        entityData
      });
      
      if (error) {
        handleLoggingError(error, entityId);
        return false;
      }
      
      console.log("Successfully logged deletion event:", data);
      return true;
    } catch (err: any) {
      console.error("Error logging deletion:", err);
      return false;
    }
  };
  
  /**
   * Invoke the edge function for logging a deletion
   */
  const invokeLogDeletionFunction = async (params: {
    logOnly: boolean;
    entityType: string;
    entityId: string;
    deletedBy: string;
    entityData: Record<string, any>;
  }) => {
    return supabase.functions.invoke('safe_delete_cafe_related_data', {
      body: params
    });
  };
  
  /**
   * Handle errors that occur during logging
   */
  const handleLoggingError = (error: any, entityId: string) => {
    console.error("Failed to log deletion:", error);
    toast.error("Failed to log deletion event", {
      id: `log-error-${entityId}`,
      duration: 3000
    });
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
      
      const result = await invokeFetchLogsFunction({
        action: 'getLogs',
        entityType,
        entityId,
        userId
      });
      
      if (result.error) {
        console.error("Failed to fetch deletion logs:", result.error);
        return [];
      }
      
      return formatDeletionLogs(result.data);
    } catch (err) {
      console.error("Error fetching deletion logs:", err);
      return [];
    }
  };
  
  /**
   * Invoke the edge function to fetch deletion logs
   */
  const invokeFetchLogsFunction = async (params: {
    action: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
  }) => {
    return supabase.functions.invoke('safe_delete_cafe_related_data', {
      body: params
    });
  };
  
  /**
   * Format the deletion logs returned from the edge function
   */
  const formatDeletionLogs = (data: any[]): DeletionLog[] => {
    console.log(`Retrieved ${data?.length || 0} deletion logs`);
    
    return (data || []).map(log => ({
      id: log.id,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      deleted_by: log.deleted_by,
      deleted_at: log.deleted_at,
      entity_data: log.entity_data
    }));
  };
  
  /**
   * Get a deleted cafe by ID
   */
  const getDeletedCafe = async (cafeId: string): Promise<Cafe | null> => {
    try {
      const { data, error } = await invokeGetDeletedCafeFunction({
        action: 'getDeletedCafe',
        cafeId
      });
      
      if (error || !data) {
        console.error("Error getting deleted cafe:", error);
        return null;
      }
      
      return formatDeletedCafeData(data);
    } catch (err) {
      console.error("Error getting deleted cafe:", err);
      return null;
    }
  };
  
  /**
   * Invoke the edge function to get deleted cafe data
   */
  const invokeGetDeletedCafeFunction = async (params: {
    action: string;
    cafeId: string;
  }) => {
    return supabase.functions.invoke('safe_delete_cafe_related_data', {
      body: params
    });
  };
  
  /**
   * Format the deleted cafe data returned from the edge function
   */
  const formatDeletedCafeData = (cafeData: any): Cafe => {
    return {
      id: cafeData.id || '',
      name: cafeData.name || '',
      ownerName: cafeData.owner_name || '',
      ownerNumber: cafeData.owner_number || '',
      numberOfHookahs: cafeData.number_of_hookahs || 0,
      numberOfTables: cafeData.number_of_tables || 0,
      status: cafeData.status || 'Pending',
      photoUrl: cafeData.photo_url,
      latitude: cafeData.latitude,
      longitude: cafeData.longitude,
      governorate: cafeData.governorate || '',
      city: cafeData.city || '',
      createdAt: cafeData.created_at || '',
      createdBy: cafeData.created_by || ''
    };
  };
  
  return {
    logDeletion,
    getDeletionLogs,
    getDeletedCafe
  };
};
