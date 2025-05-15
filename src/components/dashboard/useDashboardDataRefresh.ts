
import { useEffect, useRef } from 'react';

export const useDashboardDataRefresh = ({ refreshCafes }: { refreshCafes: (force?: boolean) => Promise<void> }) => {
  const lastRefreshTime = useRef(Date.now());
  const refreshInProgressRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Force an initial refresh when the dashboard mounts
    console.log("Dashboard hook mounted - triggering initial refresh");
    refreshCafes(true).catch(err => console.error("Initial dashboard refresh failed:", err));
    
    const refreshWithThrottle = async (force = false) => {
      // Prevent concurrent refreshes
      if (refreshInProgressRef.current) {
        console.log("Dashboard refresh already in progress, skipping");
        return;
      }
      
      // Apply throttling for non-forced refreshes
      const now = Date.now();
      if (!force && now - lastRefreshTime.current < 30000) { // 30 second throttle for regular updates
        console.log("Dashboard throttling refresh - too recent");
        return;
      }
      
      try {
        refreshInProgressRef.current = true;
        lastRefreshTime.current = now;
        await refreshCafes(force);
        console.log("Dashboard data refreshed at", new Date(now).toLocaleTimeString());
      } catch (error) {
        console.error("Error refreshing dashboard data:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    };
    
    // Listen for data update events with throttling
    const handleDataUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      
      // Check for critical updates that should bypass throttling
      const isCriticalUpdate = 
        detail.forceRefresh === true || 
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeAdded' ||
        detail.action === 'cafeDeleted';
      
      // Clear any existing debounce timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Set debounce timer
      timerRef.current = setTimeout(() => {
        refreshWithThrottle(isCriticalUpdate);
      }, isCriticalUpdate ? 500 : 2000);
    };
    
    // Register event listeners for various data change events
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_data_force_refresh', () => refreshWithThrottle(true));
    window.addEventListener('cafe_added', () => refreshWithThrottle(true));
    window.addEventListener('cafe_deleted', () => refreshWithThrottle(true));
    
    return () => {
      // Clean up event listeners and timers
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_data_force_refresh', () => refreshWithThrottle(true));
      window.removeEventListener('cafe_added', () => refreshWithThrottle(true));
      window.removeEventListener('cafe_deleted', () => refreshWithThrottle(true));
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [refreshCafes]);
};
