
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeFetch } from '@/hooks/cafe/useCafeFetch';
import { useClientSideDelete } from '@/hooks/cafe/deletion/useClientSideDelete';
import { useEdgeFunctionDelete } from '@/hooks/cafe/deletion/useEdgeFunctionDelete';
import { toast } from 'sonner';

export const useCafeState = () => {
  const { user } = useAuth();
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  
  // URGENT FIX: Use the working cafe fetch hook directly
  const { cafes, loading, error, refresh } = useCafeFetch();
  
  // Use the cafe operations without deleteCafe dependency
  const { addCafe, updateCafe, updateCafeStatus } = useCafeOperations();
  
  // Get deletion functionality
  const { clientSideDeletion } = useClientSideDelete();
  const { deleteViaEdgeFunction } = useEdgeFunctionDelete();
  
  // URGENT FIX: Create a direct fetchCafes function that immediately calls refresh
  const fetchCafes = async (force = false) => {
    console.log("URGENT FIX: fetchCafes called - executing immediate refresh");
    try {
      await refresh();
      setLastRefreshTime(Date.now());
      
      console.log("URGENT FIX: Cafes fetched successfully, dispatching events");
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
      console.error("URGENT FIX: Error in fetchCafes:", err);
      toast.error("Failed to fetch cafes");
    }
  };
  
  // URGENT FIX: Simplified delete function
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    console.log("URGENT FIX: Delete cafe called for:", cafeId);
    
    try {
      // Try edge function first
      const result = await deleteViaEdgeFunction(cafeId);
      
      if (result) {
        console.log("URGENT FIX: Edge function deletion successful");
        // Immediate refresh after deletion
        setTimeout(() => fetchCafes(true), 100);
        return true;
      }
      
      // Fallback to client-side deletion
      console.log("URGENT FIX: Falling back to client-side deletion");
      const clientResult = await clientSideDeletion(cafeId);
      
      // Always refresh after deletion attempt
      setTimeout(() => fetchCafes(true), 100);
      
      return clientResult;
    } catch (err: any) {
      console.error("URGENT FIX: Deletion error:", err);
      toast.error(`Deletion failed: ${err.message || "Unknown error"}`);
      
      // Refresh to ensure UI is accurate
      setTimeout(() => fetchCafes(true), 100);
      
      return false;
    }
  };
  
  // URGENT FIX: Simplified setCafes function
  const setCafes = (newCafes: any) => {
    console.log("URGENT FIX: setCafes called - triggering refresh");
    fetchCafes(true);
  };
  
  // URGENT FIX: Immediate refresh on mount
  useEffect(() => {
    console.log("URGENT FIX: useCafeState mounted - immediate cafe fetch");
    fetchCafes(true);
  }, []);
  
  // URGENT FIX: Show error state if there's an error
  useEffect(() => {
    if (error) {
      console.error("URGENT FIX: Cafe fetch error:", error);
      toast.error("Failed to load cafes");
    }
  }, [error]);

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
    pendingDeletions: { current: new Set() } // Simplified
  };
};
