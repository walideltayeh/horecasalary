
import { useState, useEffect, useRef } from 'react';
import { Cafe } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCafeOperations } from '@/hooks/useCafeOperations';
import { useCafeSubscription } from '@/hooks/useCafeSubscription';

export const useCafeState = () => {
  const { user } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const { loading, setLoading, addCafe, updateCafe, updateCafeStatus, deleteCafe } = useCafeOperations();
  
  const { fetchCafes } = useCafeSubscription(user, setCafes, setLoading);
  
  const pendingDeletions = useRef<Set<string>>(new Set());
  
  // Initial data fetch
  useEffect(() => {
    console.log("CafeProvider mounted, forcing initial data fetch");
    fetchCafes(true);
  }, [fetchCafes]);

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
