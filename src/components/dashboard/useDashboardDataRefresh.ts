
import { useEffect, useRef } from 'react';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(Date.now());
  
  // Add effect to listen for data updates with improved throttling
  useEffect(() => {
    const handleDataUpdated = () => {
      // Prevent multiple refreshes in quick succession
      if (refreshInProgressRef.current) {
        return;
      }
      
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < 3000) { // 3 second cooldown
        return;
      }
      
      // Refresh data when update event is detected
      refreshInProgressRef.current = true;
      lastRefreshTimeRef.current = now;
      
      refreshCafes();
      
      // Reset flag after delay
      setTimeout(() => {
        refreshInProgressRef.current = false;
      }, 500);
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
    };
  }, [refreshCafes]);
  
  // Add effect to refresh data on component mount, but only once
  useEffect(() => {
    refreshCafes();
  }, []);
};
