
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClientSideDelete } from './useClientSideDelete';

/**
 * Handles deletion using the edge function approach
 */
export const useEdgeFunctionDelete = () => {
  const deleteViaEdgeFunction = async (cafeId: string): Promise<boolean> => {
    try {
      // Show toast for starting deletion process
      toast.info("Starting deletion process...", {
        id: `delete-${cafeId}`,
        duration: 3000
      });
      
      // Try direct database deletion instead of edge function
      try {
        // First try to delete from cafe_surveys
        const { error: surveysError } = await supabase
          .from('cafe_surveys')
          .delete()
          .eq('cafe_id', cafeId);
          
        if (surveysError) {
          console.warn("DELETION: Error deleting cafe surveys:", surveysError);
        }
        
        // Then delete from cafes table
        const { error: cafesError } = await supabase
          .from('cafes')
          .delete()
          .eq('id', cafeId);
          
        if (cafesError) {
          console.error("DELETION: Error deleting cafe:", cafesError);
          toast.error(`Deletion failed: ${cafesError.message}`, {
            id: `delete-${cafeId}`,
            duration: 4000
          });
          return false;
        }
        
        // Deletion was successful
        toast.success("Deletion completed successfully", {
          id: `delete-${cafeId}`,
          duration: 2000
        });
        
        // Broadcast deletion event
        broadcastDeletionEvent(cafeId);
        return true;
      } catch (err: any) {
        console.error("DELETION: Error during direct database deletion:", err);
        toast.error(`Deletion failed: ${err.message || "Unexpected error"}`, {
          id: `delete-${cafeId}`,
          duration: 4000
        });
        return false;
      }
    } catch (err: any) {
      console.error("DELETION: Error during deletion process:", err);
      toast.error(`Deletion failed: ${err.message || "Unexpected error"}`, {
        id: `delete-${cafeId}`,
        duration: 4000
      });
      return false;
    }
  };
  
  return { deleteViaEdgeFunction };
};

/**
 * Helper to broadcast deletion events
 */
export const broadcastDeletionEvent = (cafeId: string): void => {
  try {
    window.dispatchEvent(new CustomEvent('cafe_deleted', {
      detail: { cafeId }
    }));
    localStorage.setItem('last_deleted_cafe', cafeId);
    localStorage.setItem('last_deletion_time', String(Date.now()));
  } catch (e) {
    console.warn("DELETION: Could not dispatch events:", e);
  }
};
