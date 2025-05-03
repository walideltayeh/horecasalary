
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
      
      // Add severe throttling - only refresh once every 30 seconds unless forced
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
    
    // Listen for important data update events with reduced frequency
    const handleCafeDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Only refresh for truly critical updates
      const isCriticalUpdate = 
        detail.forceRefresh === true || 
        (detail.action === 'statusUpdate' && detail.critical === true);
      
      if (isCriticalUpdate) {
        // Debounce the refresh with a longer delay
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        // Set a new timer to refresh after a longer delay
        timerRef.current = setTimeout(() => {
          refreshWithThrottle(true);
        }, 300); 
      }
    };
    
    // Listen for cafe stats updated events with much reduced frequency
    const handleStatsUpdated = () => {
      // Only refresh if last refresh was a long time ago
      const now = Date.now();
      if (now - lastRefreshTime.current < 30000) {
        console.log("Dashboard stats refresh throttled - too recent");
        return;
      }
      
      // Debounce the refresh
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Set a new timer to refresh after a delay
      timerRef.current = setTimeout(() => {
        refreshWithThrottle(false);
      }, 500);
    };
    
    window.addEventListener('horeca_data_updated', handleCafeDataUpdated);
    window.addEventListener('cafe_stats_updated', handleStatsUpdated);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('horeca_data_updated', handleCafeDataUpdated);
      window.removeEventListener('cafe_stats_updated', handleStatsUpdated);
    };
  }, [refreshCafes]);
};
