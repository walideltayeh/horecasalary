
import { useEffect, useCallback, useRef } from 'react';

interface CafeEventsProps {
  fetchCafes: (force?: boolean) => Promise<void>;
  setLastRefreshTime: React.Dispatch<React.SetStateAction<number>>;
  lastRefreshTime: number;
}

export const useCafeEvents = ({ fetchCafes, setLastRefreshTime, lastRefreshTime }: CafeEventsProps) => {
  // Manual refresh handler with increased throttling
  const refreshCafes = useCallback(async () => {
    console.log("Manual refresh triggered via context");
    const now = Date.now();
    
    // Increase throttling to 10 seconds
    if (now - lastRefreshTime < 10000) {
      console.log("Refresh throttled - skipping");
      return;
    }
    
    setLastRefreshTime(now);
    
    try {
      await fetchCafes(true);
      
      // Broadcast the refresh event to all components
      console.log("Broadcasting data refresh event");
      window.dispatchEvent(new CustomEvent('horeca_data_updated', {
        detail: { action: 'refresh', timestamp: now }
      }));
    } catch (error) {
      console.error("Error during manual refresh:", error);
    }
  }, [fetchCafes, lastRefreshTime, setLastRefreshTime]);

  return { refreshCafes };
};

export const useCafeDeletionEvents = ({ fetchCafes }: { fetchCafes: (force?: boolean) => Promise<void> }) => {
  const refreshInProgressRef = useRef(false);
  
  useEffect(() => {
    const handleCafeDeleted = (event: CustomEvent) => {
      const { cafeId } = event.detail;
      console.log(`Deletion event received for cafe ${cafeId}`);
      
      if (refreshInProgressRef.current) {
        console.log("Refresh already in progress, queueing");
        return;
      }
      
      refreshInProgressRef.current = true;
      
      // Wait a bit before forcing a refresh to ensure all operations are complete
      setTimeout(() => {
        console.log("Refreshing after deletion event");
        fetchCafes(true).finally(() => {
          refreshInProgressRef.current = false;
        });
      }, 500);
    };
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'last_deleted_cafe') {
        const deletedCafeId = event.newValue;
        if (deletedCafeId) {
          console.log(`Storage event: cafe ${deletedCafeId} deleted in another tab`);
          
          if (!refreshInProgressRef.current) {
            refreshInProgressRef.current = true;
            
            setTimeout(() => {
              fetchCafes(true).finally(() => {
                refreshInProgressRef.current = false;
              });
            }, 500);
          }
        }
      }
    };
    
    window.addEventListener('cafe_deleted' as any, handleCafeDeleted as any);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cafe_deleted' as any, handleCafeDeleted as any);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCafes]);
};
