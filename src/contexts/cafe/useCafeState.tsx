
import { useState, useRef } from 'react';
import { Cafe } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeSubscription } from '@/hooks/useCafeSubscription';
import { useCafeDataManager } from './hooks/useCafeDataManager';

export const useCafeState = () => {
  const { user } = useAuth();
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const { loading, setLoading, addCafe, updateCafe, updateCafeStatus, deleteCafe } = useCafeOperations();
  
  // Use a separate hook for managing cafe data
  const { cafes, setCafes, pendingDeletions } = useCafeDataManager();
  
  // Use the existing subscription hook
  const { fetchCafes } = useCafeSubscription(user, setCafes, setLoading);
  
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
