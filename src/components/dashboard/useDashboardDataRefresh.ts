
import { useEffect, useRef, useCallback } from 'react';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(Date.now());
  const pendingRefreshRef = useRef(false);
  
  // Create a debounced refresh function with improved reliability
  const debouncedRefresh = useCallback(() => {
    if (refreshInProgressRef.current) {
      console.log("Dashboard refresh already in progress, marking pending refresh");
      pendingRefreshRef.current = true;
      return;
    }
    
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) { // 2 second cooldown
      console.log("Dashboard refresh on cooldown, scheduling delayed refresh");
      pendingRefreshRef.current = true;
      setTimeout(() => {
        if (pendingRefreshRef.current) {
          console.log("Executing pending refresh");
          debouncedRefresh();
        }
      }, 2000);
      return;
    }
    
    // Refresh data when update event is detected
    console.log("Dashboard data refresh triggered");
    refreshInProgressRef.current = true;
    lastRefreshTimeRef.current = now;
    pendingRefreshRef.current = false;
    
    refreshCafes();
    
    // Reset flag after delay
    setTimeout(() => {
      refreshInProgressRef.current = false;
      // Check if a refresh was requested while we were refreshing
      if (pendingRefreshRef.current) {
        console.log("Executing pending refresh after completion");
        debouncedRefresh();
      }
    }, 1000);
  }, [refreshCafes]);
  
  // Add effect to listen for data updates with improved throttling
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      console.log("Dashboard received horeca_data_updated event", event.detail);
      debouncedRefresh();
    };
    
    const handleCafeDeleted = (event: CustomEvent) => {
      const cafeId = event.detail?.cafeId;
      console.log(`Dashboard received cafe_deleted event for cafe: ${cafeId || 'unknown'}`);
      debouncedRefresh();
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated as EventListener);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated as EventListener);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    };
  }, [debouncedRefresh]);
  
  // Add effect to refresh data on component mount, but only once
  useEffect(() => {
    console.log("Dashboard component mounted, refreshing data");
    refreshCafes();
  }, [refreshCafes]);
};
