
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { refreshCafeData } from '@/integrations/supabase/client';

interface CafeEventsProps {
  fetchCafes: (force?: boolean) => Promise<void>;
  setLastRefreshTime: React.Dispatch<React.SetStateAction<number>>;
  lastRefreshTime: number;
}

export const useCafeEvents = ({ fetchCafes, setLastRefreshTime, lastRefreshTime }: CafeEventsProps) => {
  // Manual refresh handler
  const refreshCafes = useCallback(async () => {
    console.log("Manual refresh triggered via context");
    const now = Date.now();
    
    if (now - lastRefreshTime < 1000) {
      console.log("Refresh throttled");
      return;
    }
    
    setLastRefreshTime(now);
    toast.info("Refreshing cafe data...");
    
    try {
      await fetchCafes(true);
      
      // Broadcast the refresh event to all components
      console.log("Broadcasting data refresh event");
      window.dispatchEvent(new CustomEvent('horeca_data_updated', {
        detail: { action: 'refresh', timestamp: now }
      }));
      
      toast.success("Cafe data refreshed successfully");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast.error("Failed to refresh cafe data");
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
