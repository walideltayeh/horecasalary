
import { useEffect, useRef, useCallback } from 'react';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(Date.now());
  const pendingRefreshRef = useRef(false);
  
  // Only refresh on initial mount and specific data changes
  useEffect(() => {
    console.log("Dashboard mounted - initial data refresh");
    refreshCafes();
    
    // No secondary automatic refresh to reduce refreshes
  }, [refreshCafes]);
  
  // Create a heavily throttled refresh function
  const debouncedRefresh = useCallback((forceRefresh = false) => {
    if (refreshInProgressRef.current) {
      console.log("Dashboard refresh already in progress, marking pending refresh");
      pendingRefreshRef.current = true;
      return;
    }
    
    const now = Date.now();
    // Increased throttling to 10 seconds (was 2 seconds)
    if (!forceRefresh && now - lastRefreshTimeRef.current < 10000) { 
      console.log("Dashboard refresh on cooldown, skipping");
      return;
    }
    
    // Only refresh data when explicitly needed
    console.log("Dashboard data refresh triggered");
    refreshInProgressRef.current = true;
    lastRefreshTimeRef.current = now;
    pendingRefreshRef.current = false;
    
    refreshCafes();
    
    // Reset flag after delay
    setTimeout(() => {
      refreshInProgressRef.current = false;
      // Only execute pending refresh for critical updates
      if (pendingRefreshRef.current && forceRefresh) {
        console.log("Executing pending critical refresh");
        debouncedRefresh(true);
      } else {
        pendingRefreshRef.current = false;
      }
    }, 2000);
  }, [refreshCafes]);
  
  // Listen ONLY for specific critical data updates
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Only refresh for specific important actions, ignore general refreshes
      if (detail.action === 'statusUpdate' || 
          detail.action === 'cafeCreated' ||
          detail.action === 'cafeEdited' ||
          detail.action === 'cafeDeleted') {
        
        console.log(`Dashboard refresh for critical update: ${detail.action}`);
        debouncedRefresh(true);
      } else {
        console.log("Ignoring non-critical update:", detail);
      }
    };
    
    const handleCafeDeleted = (event: CustomEvent) => {
      const cafeId = event.detail?.cafeId;
      console.log(`Dashboard received cafe_deleted event for cafe: ${cafeId || 'unknown'}`);
      debouncedRefresh(true); // Always force refresh on deletion
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated as EventListener);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated as EventListener);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    };
  }, [debouncedRefresh]);
};
