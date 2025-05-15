
import { useCallback } from 'react';

export const useCafeEvents = ({
  fetchCafes,
  setLastRefreshTime,
  lastRefreshTime
}: {
  fetchCafes: (force?: boolean) => Promise<void>;
  setLastRefreshTime: (time: number) => void;
  lastRefreshTime: number;
}) => {
  const refreshCafes = useCallback(async (force = false) => {
    try {
      console.log("Manual refresh triggered, force =", force);
      const now = Date.now();
      
      // For non-forced refreshes, add throttling
      if (!force && now - lastRefreshTime < 5000) {
        console.log("Refresh throttled - too recent");
        return;
      }
      
      setLastRefreshTime(now);
      
      // Always use force=true for manual refreshes to bypass caching
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
      window.dispatchEvent(new CustomEvent('cafe_stats_updated'));
      
      console.log("Manual refresh completed successfully");
    } catch (error) {
      console.error("Error during manual refresh:", error);
    }
  }, [fetchCafes, setLastRefreshTime, lastRefreshTime]);
  
  return { refreshCafes };
};

export const useCafeDeletionEvents = ({ 
  fetchCafes 
}: { 
  fetchCafes: (force?: boolean) => Promise<void>; 
}) => {
  const handleCafeDeletion = useCallback((cafeId: string) => {
    // Broadcast cafe deletion
    window.dispatchEvent(new CustomEvent('cafe_deleted', {
      detail: { cafeId, timestamp: Date.now() }
    }));
    
    // Force refresh data after a short delay
    setTimeout(() => {
      fetchCafes(true);
      
      // Also dispatch stats updated event
      window.dispatchEvent(new CustomEvent('cafe_stats_updated'));
    }, 300);
  }, [fetchCafes]);
  
  return { handleCafeDeletion };
};
