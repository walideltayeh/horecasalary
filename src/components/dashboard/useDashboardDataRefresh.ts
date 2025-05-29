
import { useEffect } from 'react';

export const useDashboardDataRefresh = ({ refreshCafes }: { refreshCafes: () => Promise<void> }) => {
  
  useEffect(() => {
    const handleCafeDataReady = (event: CustomEvent) => {
      // Data is already available, no need to refresh
    };
    
    // Only listen for data ready events
    window.addEventListener('cafe_data_ready', handleCafeDataReady as EventListener);
    
    return () => {
      window.removeEventListener('cafe_data_ready', handleCafeDataReady as EventListener);
    };
  }, [refreshCafes]);
};
