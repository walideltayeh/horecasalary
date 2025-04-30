
import { useEffect, useRef, useCallback } from 'react';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(Date.now());
  
  // Create a debounced refresh function
  const debouncedRefresh = useCallback(() => {
    if (refreshInProgressRef.current) {
      console.log("Dashboard refresh already in progress, skipping");
      return;
    }
    
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 3000) { // 3 second cooldown
      console.log("Dashboard refresh on cooldown, skipping");
      return;
    }
    
    // Refresh data when update event is detected
    console.log("Dashboard data refresh triggered");
    refreshInProgressRef.current = true;
    lastRefreshTimeRef.current = now;
    
    refreshCafes();
    
    // Reset flag after delay
    setTimeout(() => {
      refreshInProgressRef.current = false;
    }, 500);
  }, [refreshCafes]);
  
  // Add effect to listen for data updates with improved throttling
  useEffect(() => {
    const handleDataUpdated = () => {
      console.log("Dashboard received horeca_data_updated event");
      debouncedRefresh();
    };
    
    const handleCafeDeleted = () => {
      console.log("Dashboard received cafe_deleted event");
      debouncedRefresh();
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted);
    };
  }, [debouncedRefresh]);
  
  // Add effect to refresh data on component mount, but only once
  useEffect(() => {
    console.log("Dashboard component mounted, refreshing data");
    refreshCafes();
  }, [refreshCafes]);
};
