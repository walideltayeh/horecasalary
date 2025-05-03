
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
      
      // Insert directly to the deletion_logs table instead of using RPC
      const { error } = await supabase
        .from('deletion_logs')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          deleted_by: deletedBy,
          entity_data: entityData
        });
      
      if (error) {
        console.error("Failed to log deletion:", error);
        toast.error("Failed to log deletion event", {
          id: `log-error-${entityId}`,
          duration: 3000
        });
        return false;
      }
      
      console.log("Successfully logged deletion event");
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
      // Query the deletion_logs table directly with filters if provided
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
      
      const { data, error } = await query;
      
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
      // Find the most recent deletion log for this cafe
      const { data, error } = await supabase
        .from('deletion_logs')
        .select('*')
        .eq('entity_type', 'cafe')
        .eq('entity_id', cafeId)
        .order('deleted_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      // The cafe data is stored in the entity_data field
      return data.entity_data as Cafe;
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
