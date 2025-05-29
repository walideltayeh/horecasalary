
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeFetch } from '@/hooks/cafe/useCafeFetch';
import { useClientSideDelete } from '@/hooks/cafe/deletion/useClientSideDelete';
import { useEdgeFunctionDelete } from '@/hooks/cafe/deletion/useEdgeFunctionDelete';
import { toast } from 'sonner';

export const useCafeState = () => {
  const { user } = useAuth();
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const pendingDeletions = useRef<Set<string>>(new Set());
  
  // Use the working cafe fetch hook that actually queries the database
  const { cafes, loading, error, refresh } = useCafeFetch();
  
  // Use the modified hooks without the deleteCafe dependency
  const { addCafe, updateCafe, updateCafeStatus } = useCafeOperations();
  
  // Get client-side deletion functionality
  const { clientSideDeletion } = useClientSideDelete();
  
  // Get edge function deletion functionality
  const { deleteViaEdgeFunction } = useEdgeFunctionDelete();
  
  // Create a direct fetchCafes function that calls refresh
  const fetchCafes = async (force = false) => {
    console.log("fetchCafes called with force:", force);
    try {
      await refresh();
      setLastRefreshTime(Date.now());
      
      // Dispatch events to notify other components
      window.dispatchEvent(new CustomEvent('horeca_data_updated', {
        detail: { 
          action: 'refresh',
          timestamp: Date.now(),
          forceRefresh: true
        }
      }));
      
      window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
        detail: { forceRefresh: true }
      }));
    } catch (err) {
      console.error("Error in fetchCafes:", err);
    }
  };
  
  // Implement a proper deleteCafe function that uses the edge function with a fallback
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    console.log("Delete cafe called for:", cafeId);
    
    try {
      // First try to delete using the edge function
      console.log("DELETION: Attempting to delete via edge function");
      const result = await deleteViaEdgeFunction(cafeId);
      
      if (result) {
        console.log("DELETION: Edge function deletion successful");
        // Always refresh cafes after deletion
        setTimeout(() => fetchCafes(true), 500);
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
      setTimeout(() => fetchCafes(true), 500);
      
      return clientResult;
    } catch (err: any) {
      // Handle any unexpected errors
      console.error("DELETION: Unexpected error:", err);
      toast.error(`Deletion failed with error: ${err.message || "Unknown error"}`, {
        id: `delete-error-${cafeId}`
      });
      
      // Always refresh cafes to ensure UI is up to date
      setTimeout(() => fetchCafes(true), 500);
      
      return false;
    }
  };
  
  // Set up a manual setCafes function for compatibility
  const setCafes = (newCafes: any) => {
    console.log("setCafes called with:", newCafes);
    // The useCafeFetch hook manages the cafes state internally
    // We dispatch an event to trigger refresh instead
    fetchCafes(true);
  };
  
  // Add refresh on mount and listen for deletion events
  useEffect(() => {
    console.log("useCafeState mounted, fetching cafes immediately");
    fetchCafes(true);
    
    // Listen for deletion events
    const handleDeletion = () => {
      console.log("Deletion event detected, refreshing cafes");
      fetchCafes(true);
    };
    
    window.addEventListener('cafe_deleted', handleDeletion);
    
    return () => {
      window.removeEventListener('cafe_deleted', handleDeletion);
    };
  }, []);
  
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
