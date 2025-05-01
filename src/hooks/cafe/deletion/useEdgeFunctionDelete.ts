
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Handles deletion using the edge function approach
 */
export const useEdgeFunctionDelete = () => {
  const deleteViaEdgeFunction = async (cafeId: string): Promise<boolean> => {
    try {
      // Show toast for starting edge function deletion
      toast.info("Starting deletion process...", {
        id: `delete-${cafeId}`,
        duration: 3000
      });
      
      // Call the edge function to delete cafe and related data
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'safe_delete_cafe_related_data',
        { 
          body: { cafeId },
          // Add timeout to prevent UI hanging indefinitely
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (functionError) {
        console.log("DELETION: Edge function error:", functionError);
        toast.error(`Deletion failed: ${functionError.message || "Edge function error"}`, {
          id: `delete-${cafeId}`,
          duration: 4000
        });
        return false;
      }
      
      if (functionData?.success) {
        console.log("DELETION: Edge function success:", functionData);
        
        // Notify on success
        toast.success("Deletion completed successfully", {
          id: `delete-${cafeId}`,
          duration: 2000
        });
        
        // Broadcast deletion event
        broadcastDeletionEvent(cafeId);
        return true;
      } else {
        console.error("DELETION: Edge function returned error:", functionData);
        toast.error(`Deletion failed: ${functionData?.error || "Unknown error"}`, {
          id: `delete-${cafeId}`,
          duration: 4000
        });
        return false;
      }
    } catch (err: any) {
      console.error("DELETION: Error during edge function call:", err);
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
