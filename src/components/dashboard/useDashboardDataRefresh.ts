
import { useEffect, useRef } from 'react';

export const useDashboardDataRefresh = ({ refreshCafes }: { refreshCafes: () => Promise<void> }) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef<number>(0);
  
  useEffect(() => {
    const handleCafeDataReady = (event: CustomEvent) => {
      console.log("Dashboard received cafe data ready event");
      // No need to refresh again - data is already available
    };
    
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      const now = Date.now();
      
      // Heavy throttling for dashboard - minimum 10 seconds
      if (now - lastRefreshTimeRef.current < 10000) {
        console.log("Dashboard refresh throttled");
        return;
      }
      
      // Only refresh for specific critical actions
      const shouldRefresh = 
        detail.action === 'cafeDeleted' || 
        detail.action === 'statusUpdate';
      
      if (shouldRefresh && !refreshInProgressRef.current) {
        refreshInProgressRef.current = true;
        lastRefreshTimeRef.current = now;
        
        console.log("Dashboard refreshing due to critical update");
        refreshCafes().finally(() => {
          refreshInProgressRef.current = false;
        });
      }
    };
    
    // Listen for specific events only
    window.addEventListener('cafe_data_ready', handleCafeDataReady as EventListener);
    window.addEventListener('horeca_data_updated', handleDataUpdated as EventListener);
    
    return () => {
      window.removeEventListener('cafe_data_ready', handleCafeDataReady as EventListener);
      window.removeEventListener('horeca_data_updated', handleDataUpdated as EventListener);
    };
  }, [refreshCafes]);
};
