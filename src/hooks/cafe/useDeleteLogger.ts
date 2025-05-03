
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Cafe } from '@/types';

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
      
      const { data, error } = await supabase
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
  const getDeletionLogs = async (entityType?: string, entityId?: string) => {
    try {
      let query = supabase.from('deletion_logs').select('*').order('deleted_at', { ascending: false });
      
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
      
      return data;
    } catch (err) {
      console.error("Error fetching deletion logs:", err);
      return [];
    }
  };
  
  /**
   * Get a deleted cafe by ID
   */
  const getDeletedCafe = async (cafeId: string) => {
    const { data, error } = await supabase
      .from('deletion_logs')
      .select('*')
      .eq('entity_type', 'cafe')
      .eq('entity_id', cafeId)
      .order('deleted_at', { ascending: false })
      .maybeSingle();
    
    if (error || !data) {
      return null;
    }
    
    return data.entity_data as Cafe;
  };
  
  return {
    logDeletion,
    getDeletionLogs,
    getDeletedCafe
  };
};
