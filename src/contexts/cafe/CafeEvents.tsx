
import React, { useCallback } from 'react';

export const useCafeEvents = ({
  fetchCafes,
  setLastRefreshTime
}: {
  fetchCafes: (force?: boolean) => Promise<void>;
  setLastRefreshTime: (time: number) => void;
}) => {
  
  const refreshCafes = useCallback(async () => {
    // URGENT FIX: Remove throttling - execute immediately
    console.log("URGENT FIX: refreshCafes called - executing immediately");
    
    try {
      const now = Date.now();
      setLastRefreshTime(now);
      
      await fetchCafes(true);
      
      // Dispatch events immediately
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
      
      console.log("URGENT FIX: Cafes refreshed successfully");
    } catch (error) {
      console.error("URGENT FIX: Error refreshing cafes:", error);
    }
  }, [fetchCafes, setLastRefreshTime]);
  
  return { refreshCafes };
};

export const useCafeDeletionEvents = ({ 
  fetchCafes 
}: { 
  fetchCafes: (force?: boolean) => Promise<void>; 
}) => {
  const handleDeletion = useCallback((cafeId: string) => {
    // Broadcast cafe deletion
    window.dispatchEvent(new CustomEvent('cafe_deleted', {
      detail: { cafeId, timestamp: Date.now() }
    }));
    
    // URGENT FIX: Force immediate refresh
    console.log("URGENT FIX: Cafe deletion event - refreshing immediately");
    fetchCafes(true);
    
    window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
      detail: { forceRefresh: true }
    }));
  }, [fetchCafes]);
  
  return { handleDeletion };
};
