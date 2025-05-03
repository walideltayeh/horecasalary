
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Cafe, DeletionLog } from '@/types';

/**
 * Hook for logging deletion events
 */
export const useDeleteLogger = () => {
  /**
   * Log a deletion event to the deletion_logs table
   */
  const logDeletion = async (
    entityType: string,
    entityId: string,
    deletedBy: string,
    entityData: Record<string, any>
  ): Promise<boolean> => {
    try {
      console.log(`Logging deletion of ${entityType} with ID: ${entityId} by ${deletedBy}`);
      
      // We need to use rpc or direct SQL for tables not in the TypeScript definitions
      const { data, error } = await supabase.rpc('log_deletion', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_deleted_by: deletedBy,
        p_entity_data: entityData
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
   * Retrieves the deletion logs for a specific entity
   */
  const getDeletionLogs = async (entityType?: string, entityId?: string): Promise<DeletionLog[]> => {
    try {
      // Use a safer approach with rpc to get deletion logs
      let { data, error } = await supabase.rpc('get_deletion_logs', {
        p_entity_type: entityType || null,
        p_entity_id: entityId || null
      });
      
      if (error) {
        console.error("Failed to fetch deletion logs:", error);
        return [];
      }
      
      return data as DeletionLog[];
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
      const { data, error } = await supabase.rpc('get_deleted_cafe', {
        p_cafe_id: cafeId
      });
    
      if (error || !data) {
        return null;
      }
      
      return data as Cafe;
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
