
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
      
      // Make sure we have the deletedBy parameter (user ID)
      if (!deletedBy) {
        console.error("Missing deletedBy parameter for deletion logging");
        return false;
      }

      const { data, error } = await supabase.functions.invoke('safe_delete_cafe_related_data', {
        body: {
          logOnly: true,
          entityType,
          entityId,
          deletedBy,
          entityData
        }
      });
      
      if (error) {
        console.error("Failed to log deletion:", error);
        toast.error("Failed to log deletion event", {
          id: `log-error-${entityId}`,
          duration: 3000
        });
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
   * Retrieves the deletion logs with optional filtering
   */
  const getDeletionLogs = async (
    entityType?: string, 
    entityId?: string, 
    userId?: string
  ): Promise<DeletionLog[]> => {
    try {
      console.log("Fetching deletion logs with filters:", { entityType, entityId, userId });
      
      const { data, error } = await supabase.functions.invoke('safe_delete_cafe_related_data', {
        body: {
          action: 'getLogs',
          entityType,
          entityId,
          userId
        }
      });
      
      if (error) {
        console.error("Failed to fetch deletion logs:", error);
        return [];
      }
      
      console.log(`Retrieved ${data?.length || 0} deletion logs`);
      
      return (data || []).map(log => ({
        id: log.id,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        deleted_by: log.deleted_by,
        deleted_at: log.deleted_at,
        entity_data: log.entity_data
      }));
    } catch (err) {
      console.error("Error fetching deletion logs:", err);
      return [];
    }
  };
  
  /**
   * Get a deleted cafe by ID
   */
  const getDeletedCafe = async (cafeId: string): Promise<Cafe | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('safe_delete_cafe_related_data', {
        body: {
          action: 'getDeletedCafe',
          cafeId
        }
      });
      
      if (error || !data) {
        console.error("Error getting deleted cafe:", error);
        return null;
      }
      
      return {
        id: data.id || '',
        name: data.name || '',
        ownerName: data.owner_name || '',
        ownerNumber: data.owner_number || '',
        numberOfHookahs: data.number_of_hookahs || 0,
        numberOfTables: data.number_of_tables || 0,
        status: data.status || 'Pending',
        photoUrl: data.photo_url,
        latitude: data.latitude,
        longitude: data.longitude,
        governorate: data.governorate || '',
        city: data.city || '',
        createdAt: data.created_at || '',
        createdBy: data.created_by || ''
      };
    } catch (err) {
      console.error("Error getting deleted cafe:", err);
      return null;
    }
  };
  
  return {
    logDeletion,
    getDeletionLogs,
    getDeletedCafe
  };
};
