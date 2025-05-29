
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
      
      // Reduce throttling significantly - only 5 seconds instead of 2 minutes
      const now = Date.now();
      if (!force && now - lastRefreshTime.current < 5000) {
        console.log("Dashboard throttling refresh - too recent");
        return;
      }
      
      try {
        refreshInProgressRef.current = true;
        lastRefreshTime.current = now;
        console.log("Dashboard refreshing cafes at", new Date(now).toLocaleTimeString());
        await refreshCafes();
        console.log("Dashboard data refreshed successfully");
      } catch (error) {
        console.error("Error refreshing dashboard data:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    };
    
    // Listen for important data update events
    const handleCafeDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      console.log("Dashboard received data update event:", detail);
      
      // More responsive criteria for updates
      const isCriticalUpdate = 
        detail.forceRefresh === true || 
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeAdded' ||
        detail.action === 'refresh';
      
      if (isCriticalUpdate) {
        // Reduce debounce timer to 1 second for responsiveness
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        timerRef.current = setTimeout(() => {
          refreshWithThrottle(true);
        }, 1000);
      }
    };
    
    // Listen for both events
    window.addEventListener('horeca_data_updated', handleCafeDataUpdated as any);
    window.addEventListener('cafe_stats_updated', handleCafeDataUpdated as any);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('horeca_data_updated', handleCafeDataUpdated as any);
      window.removeEventListener('cafe_stats_updated', handleCafeDataUpdated as any);
    };
  }, [refreshCafes]);
};
