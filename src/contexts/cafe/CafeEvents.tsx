
import React, { useCallback, useRef } from 'react';

export const useCafeEvents = ({
  fetchCafes,
  setLastRefreshTime,
  lastRefreshTime
}: {
  fetchCafes: (force?: boolean) => Promise<void>;
  setLastRefreshTime: (time: number) => void;
  lastRefreshTime: number;
}) => {
  const refreshInProgressRef = useRef<boolean>(false);
  
  const refreshCafes = useCallback(async () => {
    // Remove throttling - allow immediate refresh
    console.log("refreshCafes called - executing immediately");
    
    try {
      refreshInProgressRef.current = true;
      const now = Date.now();
      setLastRefreshTime(now);
      
      await fetchCafes(true);
      
      // Dispatch a global event when data is refreshed
      window.dispatchEvent(new CustomEvent('horeca_data_updated', {
        detail: { 
          action: 'refresh',
          timestamp: Date.now(),
          forceRefresh: true
        }
      }));
      
      // Also dispatch stats updated event to ensure all components refresh
      window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
        detail: { forceRefresh: true }
      }));
      
      console.log("Cafes refreshed successfully");
    } catch (error) {
      console.error("Error refreshing cafes:", error);
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [fetchCafes, setLastRefreshTime]);
  
  return { refreshCafes };
};

export const useCafeDeletionEvents = ({ 
  fetchCafes 
}: { 
  fetchCafes: (force?: boolean) => Promise<void>; 
}) => {
  useCallback((cafeId: string) => {
    // Broadcast cafe deletion
    window.dispatchEvent(new CustomEvent('cafe_deleted', {
      detail: { cafeId, timestamp: Date.now() }
    }));
    
    // Force refresh data immediately
    console.log("Cafe deletion event - refreshing immediately");
    fetchCafes(true);
    
    // Also dispatch stats updated event
    window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
      detail: { forceRefresh: true }
    }));
  }, [fetchCafes]);
  
  return {};
};
