
import { useEffect, useRef } from 'react';

export const useDashboardDataRefresh = ({ refreshCafes }: { refreshCafes: () => Promise<void> }) => {
  const lastRefreshTime = useRef(Date.now());
  const refreshInProgressRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const refreshWithThrottle = async (force = false) => {
      // Prevent concurrent refreshes
      if (refreshInProgressRef.current) {
        console.log("Dashboard refresh already in progress, skipping");
        return;
      }
      
      // Significantly increase throttling - now 2 minutes instead of 30 seconds
      const now = Date.now();
      if (!force && now - lastRefreshTime.current < 120000) {
        console.log("Dashboard throttling refresh - too recent");
        return;
      }
      
      try {
        refreshInProgressRef.current = true;
        lastRefreshTime.current = now;
        await refreshCafes();
        console.log("Dashboard data refreshed at", new Date(now).toLocaleTimeString());
      } catch (error) {
        console.error("Error refreshing dashboard data:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    };
    
    // Listen for important data update events with increased throttling
    const handleCafeDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // More restrictive criteria for critical updates
      const isCriticalUpdate = 
        detail.forceRefresh === true || 
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeAdded';
      
      if (isCriticalUpdate) {
        // Set a longer debounce delay
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        // Increase debounce timer to 3 seconds
        timerRef.current = setTimeout(() => {
          refreshWithThrottle(true);
        }, 3000);
      }
    };
    
    // Specifically listen for cafe_added events
    window.addEventListener('horeca_data_updated', handleCafeDataUpdated as any);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('horeca_data_updated', handleCafeDataUpdated as any);
    };
  }, [refreshCafes]);
};
