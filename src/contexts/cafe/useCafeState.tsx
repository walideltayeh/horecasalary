
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
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const pendingDeletions = useRef<Set<string>>(new Set());
  const isInitialMount = useRef<boolean>(true);
  
  // Use the modified hooks without the deleteCafe dependency
  const { loading, setLoading, addCafe, updateCafe, updateCafeStatus } = useCafeOperations();
  
  // Use a separate hook for managing cafe data
  const { cafes, setCafes } = useCafeDataManager();
  
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
  
  // Fetch data on mount - CRITICAL to ensure data loads initially
  useEffect(() => {
    // Always force immediate data fetch when component mounts
    console.log("useCafeState mounted - forcing immediate data fetch");
    memoizedFetchCafes(true);
    
    // Listen for critical events
    const handleCriticalEvent = () => {
      console.log("Critical event detected - refreshing cafes");
      memoizedFetchCafes(true);
    };
    
    window.addEventListener('cafe_deleted', handleCriticalEvent);
    window.addEventListener('cafe_data_force_refresh', handleCriticalEvent);
    window.addEventListener('cafe_added', handleCriticalEvent);
    window.addEventListener('horeca_data_updated', handleCriticalEvent);
    
    return () => {
      window.removeEventListener('cafe_deleted', handleCriticalEvent);
      window.removeEventListener('cafe_data_force_refresh', handleCriticalEvent);
      window.removeEventListener('cafe_added', handleCriticalEvent);
      window.removeEventListener('horeca_data_updated', handleCriticalEvent);
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
