
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Cafe } from '@/types';

/**
 * Handles deletion using the edge function approach
 */
export const useEdgeFunctionDelete = () => {
  const { user } = useAuth();
  
  const deleteViaEdgeFunction = async (cafeId: string): Promise<boolean> => {
    try {
      // Show toast for starting edge function deletion
      toast.info("Starting deletion process...", {
        id: `delete-${cafeId}`,
        duration: 3000
      });
      
      // Fetch the cafe data to use as entityData before deletion
      const { data: cafeData, error: fetchError } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', cafeId)
        .single();
      
      if (fetchError || !cafeData) {
        console.error("DELETION: Failed to fetch cafe data:", fetchError);
        toast.error(`Failed to fetch cafe data: ${fetchError?.message || "Unknown error"}`, {
          id: `delete-${cafeId}`,
          duration: 3000
        });
        return false;
      }
      
      console.log("DELETION: Fetched cafe data successfully:", cafeData);
      
      // Prepare parameters for the edge function
      const params = {
        cafeId,
        entityType: 'cafe',
        entityId: cafeId,
        deletedBy: user?.id || 'unknown',
        entityData: cafeData
      };
      
      console.log("DELETION: Calling edge function with params:", params);
      
      // Call the edge function to delete cafe and related data
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'safe_delete_cafe_related_data',
        { 
          body: params,
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
        
        // Check if logging was successful
        const logMessage = functionData.logged === false 
          ? "Deletion completed, but logging failed."
          : "Deletion completed successfully with audit log.";
        
        // Notify on success
        toast.success(logMessage, {
          id: `delete-${cafeId}`,
          duration: 2000
        });
        
        // Broadcast deletion event with improved information
        broadcastDeletionEvent(cafeId, user?.id, cafeData);
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
export const broadcastDeletionEvent = (cafeId: string, userId?: string, cafeData?: any): void => {
  try {
    window.dispatchEvent(new CustomEvent('cafe_deleted', {
      detail: { 
        cafeId,
        userId,
        timestamp: Date.now(),
        cafeData
      }
    }));
    
    // Store information about the deletion in localStorage
    localStorage.setItem('last_deleted_cafe', cafeId);
    localStorage.setItem('last_deletion_time', String(Date.now()));
    if (userId) {
      localStorage.setItem('last_deletion_by', userId);
    }
    // Also store simplified cafe data for reference
    if (cafeData) {
      try {
        localStorage.setItem('last_deleted_cafe_data', JSON.stringify({
          name: cafeData.name,
          owner: cafeData.ownerName,
          location: `${cafeData.city}, ${cafeData.governorate}`
        }));
      } catch (e) {
        console.warn("DELETION: Could not store cafe data in localStorage:", e);
      }
    }
    
    console.log("Deletion event broadcast successfully", { cafeId, userId, cafeData });
  } catch (e) {
    console.warn("DELETION: Could not dispatch events:", e);
  }
};
