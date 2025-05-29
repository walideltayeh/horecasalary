
import { supabase } from '@/integrations/supabase/client';
import { DeletionLog } from '@/types';

export const useDeleteLogger = () => {
  const logDeletion = async (
    entityType: string, 
    entityId: string, 
    entityData: Record<string, any>,
    deletedBy?: string
  ): Promise<boolean> => {
    try {
      console.log("useDeleteLogger: Logging deletion with enhanced security");
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("useDeleteLogger: Authentication required for deletion logging");
        return false;
      }
      
      const finalDeletedBy = deletedBy || user.id;
      
      // Sanitize entity data to prevent XSS in logs
      const sanitizedEntityData = JSON.parse(JSON.stringify(entityData, (key, value) => {
        if (typeof value === 'string') {
          return value.replace(/[<>]/g, '').slice(0, 1000); // Limit string length
        }
        return value;
      }));
      
      const { error } = await supabase
        .from('deletion_logs')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          deleted_by: finalDeletedBy,
          entity_data: sanitizedEntityData
        });
      
      if (error) {
        console.error("useDeleteLogger: Failed to log deletion:", error);
        return false;
      }
      
      console.log("useDeleteLogger: Deletion logged successfully");
      return true;
    } catch (err: any) {
      console.error("useDeleteLogger: Error in logDeletion:", err);
      return false;
    }
  };
  
  const getDeletionLogs = async (
    entityType?: string, 
    entityId?: string, 
    deletedBy?: string
  ): Promise<DeletionLog[]> => {
    try {
      console.log("useDeleteLogger: Fetching deletion logs with security check");
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("useDeleteLogger: Authentication required for viewing logs");
        return [];
      }
      
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
      
      if (deletedBy) {
        query = query.eq('deleted_by', deletedBy);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("useDeleteLogger: Failed to fetch deletion logs:", error);
        return [];
      }
      
      console.log("useDeleteLogger: Retrieved", data?.length || 0, "deletion logs");
      return data || [];
    } catch (err: any) {
      console.error("useDeleteLogger: Error in getDeletionLogs:", err);
      return [];
    }
  };
  
  return {
    logDeletion,
    getDeletionLogs
  };
};
