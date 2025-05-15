
import { useEffect, useRef } from 'react';

export const useDashboardDataRefresh = ({ refreshCafes }: { refreshCafes: (force?: boolean) => Promise<void> }) => {
  const lastRefreshTime = useRef(Date.now());
  const refreshInProgressRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Force an initial refresh when the dashboard mounts
    console.log("Dashboard mounted - triggering initial refresh");
    refreshCafes(true).catch(err => console.error("Initial dashboard refresh failed:", err));
    
    const refreshWithThrottle = async (force = false) => {
      // Prevent concurrent refreshes
      if (refreshInProgressRef.current) {
        console.log("Dashboard refresh already in progress, skipping");
        return;
      }
      
      // Apply throttling for non-forced refreshes
      const now = Date.now();
      if (!force && now - lastRefreshTime.current < 60000) { // 1 minute throttle
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
    
    // Listen for important data update events with throttling
    const handleCafeDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Check for critical updates that should bypass throttling
      const isCriticalUpdate = 
        detail.forceRefresh === true || 
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeAdded';
      
      if (isCriticalUpdate) {
        // Clear any existing debounce timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        // Set a short debounce timer to prevent rapid-fire updates
        timerRef.current = setTimeout(() => {
          console.log("Critical data update detected - refreshing dashboard");
          refreshWithThrottle(true);
        }, 1000);
      } else {
        // For non-critical updates, use a longer debounce and respect throttling
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        timerRef.current = setTimeout(() => {
          refreshWithThrottle(false);
        }, 2000);
      }
    };
    
    // Register event listeners
    window.addEventListener('horeca_data_updated', handleCafeDataUpdated as any);
    window.addEventListener('cafe_stats_updated', () => refreshWithThrottle(true));
    window.addEventListener('cafe_added', () => refreshWithThrottle(true));
    
    return () => {
      // Clean up event listeners and timers
      window.removeEventListener('horeca_data_updated', handleCafeDataUpdated as any);
      window.removeEventListener('cafe_stats_updated', () => refreshWithThrottle(true));
      window.removeEventListener('cafe_added', () => refreshWithThrottle(true));
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [refreshCafes]);
};
