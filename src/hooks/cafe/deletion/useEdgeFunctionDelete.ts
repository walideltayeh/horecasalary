
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Cafe } from '@/types';

/**
 * Interface for deletion parameters
 */
interface DeletionParams {
  cafeId: string;
  entityType: string;
  entityId: string;
  deletedBy: string;
  entityData: Record<string, any>;
}

/**
 * Handles deletion using the edge function approach
 */
export const useEdgeFunctionDelete = () => {
  const { user } = useAuth();
  
  /**
   * Main entry point for deleting a cafe via edge function
   */
  const deleteViaEdgeFunction = async (cafeId: string): Promise<boolean> => {
    try {
      // Show initial toast
      notifyDeletionStarted(cafeId);
      
      // Fetch the cafe data before deletion
      const cafeData = await fetchCafeData(cafeId);
      if (!cafeData) {
        return false;
      }
      
      // Prepare parameters for deletion
      const params = prepareDeletionParams(cafeId, user?.id || 'unknown', cafeData);
      
      // Call the edge function to delete cafe and related data
      const result = await invokeEdgeFunction(params);
      
      // Handle the result
      return handleDeletionResult(result, cafeId, user?.id, cafeData);
    } catch (err: any) {
      // Handle any unexpected errors
      handleDeletionError(err, cafeId);
      return false;
    }
  };
  
  /**
   * Notify user that deletion has started
   */
  const notifyDeletionStarted = (cafeId: string): void => {
    toast.info("Starting deletion process...", {
      id: `delete-${cafeId}`,
      duration: 3000
    });
  };
  
  /**
   * Fetch cafe data before deletion
   */
  const fetchCafeData = async (cafeId: string): Promise<any | null> => {
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
      return null;
    }
    
    console.log("DELETION: Fetched cafe data successfully:", cafeData);
    return cafeData;
  };
  
  /**
   * Prepare parameters for the edge function
   */
  const prepareDeletionParams = (cafeId: string, userId: string, cafeData: any): DeletionParams => {
    const params = {
      cafeId,
      entityType: 'cafe',
      entityId: cafeId,
      deletedBy: userId,
      entityData: cafeData
    };
    
    console.log("DELETION: Prepared edge function params:", params);
    return params;
  };
  
  /**
   * Invoke the edge function to delete cafe and related data
   */
  const invokeEdgeFunction = async (params: DeletionParams) => {
    console.log("DELETION: Calling edge function with params:", params);
    
    return supabase.functions.invoke(
      'safe_delete_cafe_related_data',
      { 
        body: params,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  };
  
  /**
   * Handle the result of the edge function call
   */
  const handleDeletionResult = (
    result: { data: any; error: any; },
    cafeId: string,
    userId?: string,
    cafeData?: any
  ): boolean => {
    if (result.error) {
      console.log("DELETION: Edge function error:", result.error);
      toast.error(`Deletion failed: ${result.error.message || "Edge function error"}`, {
        id: `delete-${cafeId}`,
        duration: 4000
      });
      return false;
    }
    
    if (result.data?.success) {
      console.log("DELETION: Edge function success:", result.data);
      
      // Check if logging was successful
      const logMessage = result.data.logged === false 
        ? "Deletion completed, but logging failed."
        : "Deletion completed successfully with audit log.";
      
      // Notify on success
      toast.success(logMessage, {
        id: `delete-${cafeId}`,
        duration: 2000
      });
      
      // Broadcast deletion event
      broadcastDeletionEvent(cafeId, userId, cafeData);
      return true;
    } else {
      console.error("DELETION: Edge function returned error:", result.data);
      toast.error(`Deletion failed: ${result.data?.message || "Unknown error"}`, {
        id: `delete-${cafeId}`,
        duration: 4000
      });
      return false;
    }
  };
  
  /**
   * Handle any unexpected errors during the deletion process
   */
  const handleDeletionError = (err: any, cafeId: string): void => {
    console.error("DELETION: Error during edge function call:", err);
    toast.error(`Deletion failed: ${err.message || "Unexpected error"}`, {
      id: `delete-${cafeId}`,
      duration: 4000
    });
  };
  
  return { deleteViaEdgeFunction };
};

/**
 * Helper to broadcast deletion events
 */
export const broadcastDeletionEvent = (cafeId: string, userId?: string, cafeData?: any): void => {
  try {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('cafe_deleted', {
      detail: { 
        cafeId,
        userId,
        timestamp: Date.now(),
        cafeData
      }
    }));
    
    // Store deletion information in localStorage
    storeDeletionInfoInLocalStorage(cafeId, userId, cafeData);
    
    console.log("Deletion event broadcast successfully", { cafeId, userId, cafeData });
  } catch (e) {
    console.warn("DELETION: Could not dispatch events:", e);
  }
};

/**
 * Store deletion information in localStorage
 */
const storeDeletionInfoInLocalStorage = (cafeId: string, userId?: string, cafeData?: any): void => {
  try {
    localStorage.setItem('last_deleted_cafe', cafeId);
    localStorage.setItem('last_deletion_time', String(Date.now()));
    
    if (userId) {
      localStorage.setItem('last_deletion_by', userId);
    }
    
    // Store simplified cafe data for reference
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
  } catch (e) {
    console.warn("DELETION: Could not store deletion info in localStorage:", e);
  }
};
