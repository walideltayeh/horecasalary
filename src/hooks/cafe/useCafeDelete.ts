
import { useState } from 'react';
import { toast } from 'sonner';
import { useEdgeFunctionDelete } from './deletion/useEdgeFunctionDelete';
import { useClientSideDelete } from './deletion/useClientSideDelete';
import { useTimeoutHandling } from './deletion/useTimeoutHandling';

export const useCafeDelete = () => {
  const { deleteViaEdgeFunction } = useEdgeFunctionDelete();
  const { clientSideDeletion } = useClientSideDelete();
  const { setupTimeout } = useTimeoutHandling();

  // Improved deletion function with optimistic updates, non-blocking operations
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    try {
      console.log(`DELETION: Starting deletion process for cafe ${cafeId}`);

      // Track cancel state
      let isCancelled = false;
      
      // Set up timeout for slow operations notice
      const { clearTimeout } = setupTimeout(cafeId, () => {
        isCancelled = true;
      });

      try {
        // First try the edge function approach (most reliable)
        const functionResult = await deleteViaEdgeFunction(cafeId);
        
        clearTimeout();
        
        if (!functionResult) {
          console.log("DELETION: Edge function failed, falling back to client deletion");
          
          // Edge function failed, try client-side deletion
          const fallbackResult = await clientSideDeletion(cafeId);
          return fallbackResult;
        }
        
        return true;
      } catch (err: any) {
        clearTimeout();
        
        // Since we can't use AbortController signal, we'll check for specific error types
        if (err.name === 'AbortError' || isCancelled) {
          console.warn("DELETION: Operation was aborted");
          toast.error("Deletion operation was cancelled", {
            id: `delete-${cafeId}`
          });
          return false;
        }
        
        console.error("DELETION: Error during edge function call:", err);
        
        // Try client-side deletion as fallback
        const fallbackResult = await clientSideDeletion(cafeId);
        return fallbackResult;
      }
    } catch (generalError: any) {
      console.error("DELETION: Critical error in deletion process:", generalError);
      toast.error(`Deletion failed: ${generalError.message || "Unknown error"}`, {
        id: `delete-${cafeId}`
      });
      return false;
    }
  };

  return { deleteCafe };
};
