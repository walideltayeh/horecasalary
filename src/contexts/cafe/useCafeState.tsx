
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
  
  // Use the simplified cafe fetch hook
  const { cafes, loading, error, refresh } = useCafeFetch();
  
  // Use the cafe operations
  const { addCafe, updateCafe, updateCafeStatus } = useCafeOperations();
  
  // Get deletion functionality
  const { clientSideDeletion } = useClientSideDelete();
  const { deleteViaEdgeFunction } = useEdgeFunctionDelete();
  
  // Simple fetchCafes function
  const fetchCafes = async (force = false) => {
    try {
      await refresh();
      setLastRefreshTime(Date.now());
    } catch (err) {
      console.error("Error in fetchCafes:", err);
      toast.error("Failed to fetch cafes");
    }
  };
  
  // Simple delete function
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    try {
      const result = await deleteViaEdgeFunction(cafeId);
      
      if (result) {
        setTimeout(() => fetchCafes(true), 100);
        return true;
      }
      
      const clientResult = await clientSideDeletion(cafeId);
      setTimeout(() => fetchCafes(true), 100);
      
      return clientResult;
    } catch (err: any) {
      console.error("Deletion error:", err);
      toast.error(`Deletion failed: ${err.message || "Unknown error"}`);
      return false;
    }
  };
  
  // Simple setCafes function
  const setCafes = (newCafes: any) => {
    refresh();
  };
  
  // Show error state if there's an error
  useEffect(() => {
    if (error) {
      console.error("Cafe fetch error:", error);
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
    pendingDeletions: { current: new Set() }
  };
};
