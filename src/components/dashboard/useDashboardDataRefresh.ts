
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
    
    // Also set up a secondary refresh for cases where the first one might miss data
    const initialDataTimer = setTimeout(() => {
      console.log("Dashboard secondary data refresh to ensure data is current");
      refreshCafes();
    }, 1500);
    
    return () => clearTimeout(initialDataTimer);
  }, [refreshCafes]);
  
  // Create a debounced refresh function with reduced throttling
  const debouncedRefresh = useCallback((forceRefresh = false) => {
    if (refreshInProgressRef.current) {
      console.log("Dashboard refresh already in progress, marking pending refresh");
      pendingRefreshRef.current = true;
      return;
    }
    
    const now = Date.now();
    // Reduced throttling from 5 seconds to 2 seconds to be more responsive
    if (!forceRefresh && now - lastRefreshTimeRef.current < 2000) { 
      console.log("Dashboard refresh on cooldown, scheduling delayed refresh");
      pendingRefreshRef.current = true;
      setTimeout(() => {
        if (pendingRefreshRef.current) {
          console.log("Executing pending refresh");
          debouncedRefresh(true); // Force the refresh when executing a pending one
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
        debouncedRefresh(true); // Force the refresh when executing a pending one
      }
    }, 1000);
  }, [refreshCafes]);
  
  // Listen for specific data update events with improved handling for important events
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      console.log("Dashboard received data update:", detail);
      
      // Force refresh for important updates like status changes
      const forceRefresh = detail.forceRefresh === true || 
                          detail.action === 'statusUpdate' || 
                          detail.action === 'cafeCreated' ||
                          detail.action === 'cafeEdited';
                          
      debouncedRefresh(forceRefresh);
    };
    
    const handleCafeDeleted = (event: CustomEvent) => {
      const cafeId = event.detail?.cafeId;
      console.log(`Dashboard received cafe_deleted event for cafe: ${cafeId || 'unknown'}`);
      debouncedRefresh(true); // Always force refresh on deletion
    };
    
    // Add handler for direct refresh requests
    const handleRefreshRequested = (event: CustomEvent) => {
      const force = event.detail?.force === true;
      console.log(`Dashboard received refresh request, force: ${force}`);
      debouncedRefresh(force);
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated as EventListener);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated as EventListener);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
    };
  }, [debouncedRefresh]);
};
