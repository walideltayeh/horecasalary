
import { useEffect, useRef } from 'react';

export const useDashboardDataRefresh = ({ refreshCafes }: { refreshCafes: () => Promise<void> }) => {
  const refreshInProgressRef = useRef(false);
  
  useEffect(() => {
    const refreshImmediately = async (force = false) => {
      // URGENT FIX: Remove throttling - execute immediately
      if (refreshInProgressRef.current) {
        console.log("URGENT FIX: Dashboard refresh already in progress, skipping");
        return;
      }
      
      try {
        refreshInProgressRef.current = true;
        console.log("URGENT FIX: Dashboard refreshing cafes immediately");
        await refreshCafes();
        console.log("URGENT FIX: Dashboard data refreshed successfully");
      } catch (error) {
        console.error("URGENT FIX: Error refreshing dashboard data:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    };
    
    // Listen for data update events
    const handleCafeDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      console.log("URGENT FIX: Dashboard received data update event:", detail);
      
      // URGENT FIX: Refresh immediately for any update
      refreshImmediately(true);
    };
    
    // Listen for both events
    window.addEventListener('horeca_data_updated', handleCafeDataUpdated as any);
    window.addEventListener('cafe_stats_updated', handleCafeDataUpdated as any);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleCafeDataUpdated as any);
      window.removeEventListener('cafe_stats_updated', handleCafeDataUpdated as any);
    };
  }, [refreshCafes]);
};
