
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeSubscription } from '@/hooks/useCafeSubscription';
import { useCafeDataManager } from './hooks/useCafeDataManager';
import { useEdgeFunctionDelete } from '@/hooks/cafe/deletion/useEdgeFunctionDelete';

export const useCafeState = () => {
  const { user } = useAuth();
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  
  // Use the modified hooks without the deleteCafe dependency
  const { loading, setLoading, addCafe, updateCafe, updateCafeStatus } = useCafeOperations();
  
  // Use a separate hook for managing cafe data
  const { cafes, setCafes, pendingDeletions } = useCafeDataManager();
  
  // Import the fetchCafes from useCafeSubscription
  const { fetchCafes } = useCafeSubscription(user, setCafes, setLoading);
  
  // Use the edge function delete hook
  const { deleteViaEdgeFunction } = useEdgeFunctionDelete();
  
  // Implement a proper deleteCafe function that uses the edge function
  const deleteCafe = async (cafeId: string): Promise<boolean> => {
    console.log("Delete cafe called for:", cafeId);
    
    // Use the edge function to perform deletion
    const result = await deleteViaEdgeFunction(cafeId);
    
    // Even if deletion fails, refresh to ensure UI is up to date
    await fetchCafes(true);
    
    return result;
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
