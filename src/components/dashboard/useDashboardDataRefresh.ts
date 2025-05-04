
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
      
      // Reduce throttling - now only 30 seconds instead of 2 minutes
      const now = Date.now();
      if (!force && now - lastRefreshTime.current < 30000) {
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
    
    // Listen for important data update events with reduced throttling
    const handleCafeDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // More relaxed criteria for critical updates - especially for additions
      const isCriticalUpdate = 
        detail.forceRefresh === true || 
        detail.highPriority === true ||
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeAdded';
      
      if (isCriticalUpdate) {
        // Reduce debounce delay for critical updates
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        // Set a shorter timer for critical updates
        timerRef.current = setTimeout(() => {
          refreshWithThrottle(true);
        }, 500);
      }
    };
    
    // Listen for cafe added events specifically with high priority
    const handleCafeAdded = () => {
      console.log("Dashboard detected cafe_added event - high priority refresh");
      // Always treat cafe_added as high priority
      refreshWithThrottle(true);
    };
    
    // Specifically listen for cafe_added events
    window.addEventListener('cafe_added', handleCafeAdded);
    window.addEventListener('horeca_data_updated', handleCafeDataUpdated as any);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('horeca_data_updated', handleCafeDataUpdated as any);
      window.removeEventListener('cafe_added', handleCafeAdded);
    };
  }, [refreshCafes]);
};
