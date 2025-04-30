
import { useEffect, useRef, useCallback } from 'react';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(Date.now());
  const pendingRefreshRef = useRef(false);
  
  // Create a debounced refresh function with much stronger throttling
  const debouncedRefresh = useCallback(() => {
    if (refreshInProgressRef.current) {
      console.log("Dashboard refresh already in progress, marking pending refresh");
      pendingRefreshRef.current = true;
      return;
    }
    
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 10000) { // Increased to 10 second cooldown
      console.log("Dashboard refresh on cooldown, scheduling delayed refresh");
      pendingRefreshRef.current = true;
      setTimeout(() => {
        if (pendingRefreshRef.current) {
          console.log("Executing pending refresh");
          debouncedRefresh();
        }
      }, 10000); // Increased delay
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
    }, 2000); // Increased to 2 seconds
  }, [refreshCafes]);
  
  // Listen for only specific data update events
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Only refresh on important events like status updates or creation
      if (detail.action === 'statusUpdate' || detail.action === 'cafeCreated') {
        console.log("Dashboard received important data update:", detail);
        debouncedRefresh();
      } else {
        console.log("Dashboard ignoring non-critical update:", detail);
      }
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
  
  // Only refresh on mount, but limit to once
  useEffect(() => {
    const initialLoadComplete = sessionStorage.getItem('dashboard_initial_load');
    
    if (!initialLoadComplete) {
      console.log("Dashboard component mounted, refreshing data");
      refreshCafes();
      sessionStorage.setItem('dashboard_initial_load', 'true');
    } else {
      console.log("Dashboard mounted but skipping initial refresh");
    }
  }, [refreshCafes]);
};
