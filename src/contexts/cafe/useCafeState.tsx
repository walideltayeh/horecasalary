
import { useState, useEffect } from 'react';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeFetch } from '@/hooks/cafe/useCafeFetch';
import { useClientSideDelete } from '@/hooks/cafe/deletion/useClientSideDelete';
import { useEdgeFunctionDelete } from '@/hooks/cafe/deletion/useEdgeFunctionDelete';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useCafeState = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const { user, session } = useAuth();
  
  // Use the cafe fetch hook with auth dependency
  const { cafes, loading, error, refresh } = useCafeFetch();
  
  // Use the cafe operations
  const { addCafe, updateCafe, updateCafeStatus } = useCafeOperations();
  
  // Get deletion functionality
  const { clientSideDeletion } = useClientSideDelete();
  const { deleteViaEdgeFunction } = useEdgeFunctionDelete();
  
  // Simplified fetchCafes function with throttling
  const fetchCafes = async (force = false) => {
    const now = Date.now();
    
    // Throttle non-forced refreshes
    if (!force && now - lastRefreshTime < 10000) {
      console.log("useCafeState: Throttling fetch request");
      return;
    }
    
    try {
      console.log("useCafeState: Triggering cafe refresh");
      await refresh();
      setLastRefreshTime(now);
    } catch (err: any) {
      console.error("useCafeState: Error in fetchCafes:", err);
      // Only show error toast if user is authenticated
      if (user && session) {
        toast.error(`Failed to fetch cafes: ${err.message || 'Unknown error'}`);
      }
    }
  };
  
  // Simplified delete function
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    if (!user || !session) {
      toast.error("Authentication required");
      return false;
    }
    
    try {
      console.log("useCafeState: Attempting to delete cafe:", cafeId);
      
      // Try edge function first
      const result = await deleteViaEdgeFunction(cafeId);
      
      if (result) {
        console.log("useCafeState: Edge function deletion successful");
        setTimeout(() => fetchCafes(true), 1000);
        return true;
      }
      
      // Fallback to client-side deletion
      console.log("useCafeState: Falling back to client-side deletion");
      const clientResult = await clientSideDeletion(cafeId);
      
      if (clientResult) {
        setTimeout(() => fetchCafes(true), 1000);
      }
      
      return clientResult;
    } catch (err: any) {
      console.error("useCafeState: Deletion error:", err);
      toast.error(`Deletion failed: ${err.message || "Unknown error"}`);
      return false;
    }
  };
  
  // Only show error if user is authenticated
  useEffect(() => {
    if (error && user && session) {
      console.error("useCafeState: Cafe fetch error detected:", error);
      toast.error(error);
    }
  }, [error, user, session]);

  return { 
    cafes,
    setCafes: () => {
      console.log("useCafeState: setCafes called, triggering refresh");
      refresh();
    },
    loading,
    fetchCafes,
    addCafe,
    updateCafe,
    updateCafeStatus,
    deleteCafe,
    lastRefreshTime,
    setLastRefreshTime,
    pendingDeletions: { current: new Set() }
  };
};
