
import { useEffect, useRef } from 'react';

export const useDashboardDataRefresh = ({ refreshCafes }: { refreshCafes: () => Promise<void> }) => {
  const refreshInProgressRef = useRef(false);
  
  useEffect(() => {
    const handleCafeDataReady = (event: CustomEvent) => {
      console.log("Dashboard received cafe data ready event");
      // Data is already available, no need to refresh
    };
    
    // Only listen for data ready events
    window.addEventListener('cafe_data_ready', handleCafeDataReady as EventListener);
    
    return () => {
      window.removeEventListener('cafe_data_ready', handleCafeDataReady as EventListener);
    };
  }, [refreshCafes]);
};
