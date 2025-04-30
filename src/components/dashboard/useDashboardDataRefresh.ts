
import { useEffect, useRef, useCallback } from 'react';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(Date.now());
  const pendingRefreshRef = useRef(false);
  
  // Immediately refresh on mount to ensure counts are accurate
  useEffect(() => {
    console.log("Dashboard mounted - forcing initial data refresh");
    refreshCafes();
  }, [refreshCafes]);
  
  // Create a debounced refresh function with throttling
  const debouncedRefresh = useCallback(() => {
    if (refreshInProgressRef.current) {
      console.log("Dashboard refresh already in progress, marking pending refresh");
      pendingRefreshRef.current = true;
      return;
    }
    
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 5000) { // 5 second cooldown
      console.log("Dashboard refresh on cooldown, scheduling delayed refresh");
      pendingRefreshRef.current = true;
      setTimeout(() => {
        if (pendingRefreshRef.current) {
          console.log("Executing pending refresh");
          debouncedRefresh();
        }
      }, 5000);
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
  
  // Listen for specific data update events
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      console.log("Dashboard received data update:", detail);
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
};
