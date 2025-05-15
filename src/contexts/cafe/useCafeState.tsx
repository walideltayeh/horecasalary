
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeSubscription } from '@/hooks/useCafeSubscription';
import { useCafeDataManager } from './hooks/useCafeDataManager';
import { useClientSideDelete } from '@/hooks/cafe/deletion/useClientSideDelete';
import { useEdgeFunctionDelete } from '@/hooks/cafe/deletion/useEdgeFunctionDelete';
import { toast } from 'sonner';

export const useCafeState = () => {
  const { user } = useAuth();
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const pendingDeletions = useRef<Set<string>>(new Set());
  const isInitialMount = useRef<boolean>(true);
  
  // Use the modified hooks without the deleteCafe dependency
  const { loading, setLoading, addCafe, updateCafe, updateCafeStatus } = useCafeOperations();
  
  // Use a separate hook for managing cafe data
  const { cafes, setCafes, pendingDeletions: dataPendingDeletions } = useCafeDataManager();
  
  // Import the fetchCafes from useCafeSubscription with memoization
  const { fetchCafes } = useCafeSubscription(user, setCafes, setLoading);
  
  // Memoize fetchCafes to prevent unnecessary hook recreations
  const memoizedFetchCafes = useCallback(fetchCafes, [fetchCafes]);
  
  // Get client-side deletion functionality
  const { clientSideDeletion } = useClientSideDelete();
  
  // Get edge function deletion functionality
  const { deleteViaEdgeFunction } = useEdgeFunctionDelete();
  
  // Implement a proper deleteCafe function that uses the edge function with a fallback
  const deleteCafe = useCallback(async (cafeId: string): Promise<boolean> => {
    console.log("Delete cafe called for:", cafeId);
    
    try {
      // First try to delete using the edge function
      console.log("DELETION: Attempting to delete via edge function");
      const result = await deleteViaEdgeFunction(cafeId);
      
      if (result) {
        console.log("DELETION: Edge function deletion successful");
        // Always refresh cafes after deletion - with a delay to allow server processing
        setTimeout(() => memoizedFetchCafes(true), 500);
        return true;
      }
      
      // If edge function fails, fall back to client-side deletion
      console.log("DELETION: Edge function failed, falling back to client-side deletion");
      toast.info("Edge function deletion failed. Trying client-side deletion...", {
        id: `delete-fallback-${cafeId}`,
        duration: 3000
      });
      
      // Use the enhanced client-side deletion with improved error handling
      const clientResult = await clientSideDeletion(cafeId);
      
      // Always refresh cafes after deletion attempt
      setTimeout(() => memoizedFetchCafes(true), 500);
      
      return clientResult;
    } catch (err: any) {
      // Handle any unexpected errors
      console.error("DELETION: Unexpected error:", err);
      toast.error(`Deletion failed with error: ${err.message || "Unknown error"}`, {
        id: `delete-error-${cafeId}`
      });
      
      // Always refresh cafes to ensure UI is up to date
      setTimeout(() => memoizedFetchCafes(true), 500);
      
      return false;
    }
  }, [memoizedFetchCafes, deleteViaEdgeFunction, clientSideDeletion]);
  
  // Add refresh on mount with staggered loading to prevent simultaneous requests
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // Stagger the initial data fetch to avoid overloading on app startup
      setTimeout(() => {
        memoizedFetchCafes(true);
      }, 500);
    }
    
    // Listen for deletion events
    const handleDeletion = () => {
      console.log("Deletion event detected, refreshing cafes");
      // Slight delay to allow server processing
      setTimeout(() => memoizedFetchCafes(true), 800); 
    };
    
    window.addEventListener('cafe_deleted', handleDeletion);
    
    return () => {
      window.removeEventListener('cafe_deleted', handleDeletion);
    };
  }, [memoizedFetchCafes]);
  
  return { 
    cafes,
    setCafes,
    loading,
    fetchCafes: memoizedFetchCafes,
    addCafe,
    updateCafe,
    updateCafeStatus,
    deleteCafe,
    lastRefreshTime,
    setLastRefreshTime,
    pendingDeletions
  };
};
