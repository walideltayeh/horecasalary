
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeSubscription } from '@/hooks/useCafeSubscription';
import { useCafeDataManager } from './hooks/useCafeDataManager';
import { useClientSideDelete } from '@/hooks/cafe/deletion/useClientSideDelete';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { broadcastDeletionEvent } from '@/hooks/cafe/deletion/useEdgeFunctionDelete';

// Define proper types for the edge function response
type EdgeFunctionResponse = {
  data?: { success: boolean; message?: string; error?: string };
  error?: { message: string };
};

export const useCafeState = () => {
  const { user } = useAuth();
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  
  // Use the modified hooks without the deleteCafe dependency
  const { loading, setLoading, addCafe, updateCafe, updateCafeStatus } = useCafeOperations();
  
  // Use a separate hook for managing cafe data
  const { cafes, setCafes, pendingDeletions } = useCafeDataManager();
  
  // Import the fetchCafes from useCafeSubscription
  const { fetchCafes } = useCafeSubscription(user, setCafes, setLoading);
  
  // Get client-side deletion functionality
  const { clientSideDeletion } = useClientSideDelete();
  
  // Implement a proper deleteCafe function that uses the edge function with a fallback
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    console.log("Delete cafe called for:", cafeId);
    
    try {
      // Show initial toast
      toast.info("Starting deletion process...", {
        id: `delete-${cafeId}`,
        duration: 3000
      });
      
      // First try to delete using the edge function
      const result = await Promise.race([
        supabase.functions.invoke(
          'safe_delete_cafe_related_data',
          { 
            body: { cafeId },
            headers: {
              'Content-Type': 'application/json'
            }
          }
        ),
        // Add a timeout promise to prevent hanging
        new Promise<EdgeFunctionResponse>((_, reject) => 
          setTimeout(() => reject(new Error('Edge function timed out')), 10000)
        )
      ]).catch(error => {
        console.error("Edge function error or timeout:", error);
        return { error: { message: error.message || "Edge function timeout" } } as EdgeFunctionResponse;
      });
      
      // Now properly cast the result to the expected type
      const response = result as EdgeFunctionResponse;
      
      if (response.error) {
        console.log("DELETION: Edge function failed, falling back to client-side deletion");
        toast.error(`Edge function error: ${response.error.message}. Trying fallback method...`, {
          id: `delete-${cafeId}`
        });
        
        // Fall back to client-side deletion
        const result = await clientSideDeletion(cafeId);
        
        // Always refresh cafes after deletion attempt
        setTimeout(() => fetchCafes(true), 500);
        
        return result;
      }
      
      if (response.data?.success) {
        console.log("DELETION: Edge function success:", response.data);
        
        // Notify on success
        toast.success("Deletion completed successfully", {
          id: `delete-${cafeId}`,
          duration: 2000
        });
        
        // Broadcast deletion event
        broadcastDeletionEvent(cafeId);
        
        // Always refresh cafes after deletion
        setTimeout(() => fetchCafes(true), 500);
        
        return true;
      } else {
        console.error("DELETION: Edge function returned error:", response.data);
        toast.error(`Deletion failed: ${response.data?.error || "Unknown error"}`, {
          id: `delete-${cafeId}`,
          duration: 4000
        });
        
        // Try the client-side deletion as a fallback
        console.log("DELETION: Attempting client-side deletion as fallback");
        const result = await clientSideDeletion(cafeId);
        
        // Always refresh cafes after deletion attempt
        setTimeout(() => fetchCafes(true), 500);
        
        return result;
      }
    } catch (err: any) {
      // Handle any unexpected errors
      console.error("DELETION: Unexpected error:", err);
      toast.error(`Deletion failed with error: ${err.message || "Unknown error"}`, {
        id: `delete-${cafeId}`
      });
      
      // Always refresh cafes to ensure UI is up to date
      setTimeout(() => fetchCafes(true), 500);
      
      return false;
    }
  };
  
  return { 
    cafes,
    setCafes,
    loading,
    fetchCafes,
    addCafe,
    updateCafe,
    updateCafeStatus,
    deleteCafe,
    lastRefreshTime,
    setLastRefreshTime,
    pendingDeletions
  };
};
