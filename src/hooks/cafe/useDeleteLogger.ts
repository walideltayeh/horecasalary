
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
      
      // Insert directly to the deletion_logs table using SQL function
      const { error } = await supabase.functions.invoke('safe_delete_cafe_related_data', {
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
      let query = supabase.from('deletion_logs').select('*');
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      
      const { data, error } = await query.order('deleted_at', { ascending: false });
      
      if (error) {
        console.error("Failed to fetch deletion logs:", error);
        return [];
      }
      
      return (data as any[]).map(log => ({
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
      // We need to cast it properly to match the Cafe type
      const cafeData = data.entity_data as any;
      
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
