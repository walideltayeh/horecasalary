
import { useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';

export const useDashboardDataRefresh = ({ refreshCafes }: { refreshCafes: () => Promise<void> }) => {
  const lastRefreshTime = useRef(Date.now());
  const refreshInProgressRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const refreshWithThrottle = async (force = false) => {
      // Prevent concurrent refreshes
      if (refreshInProgressRef.current) {
        return;
      }
      
      // Add throttling - only refresh once every 10 seconds unless forced
      const now = Date.now();
      if (!force && now - lastRefreshTime.current < 10000) {
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
    
    // Listen for important data update events
    const handleCafeDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Only refresh for critical updates
      const isCriticalUpdate = 
        detail.action === 'statusUpdate' ||
        detail.action === 'cafeCreated' ||
        detail.action === 'cafeDeleted';
      
      if (isCriticalUpdate || detail.forceRefresh) {
        // Debounce the refresh - clear any existing timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        // Set a new timer to refresh after a delay
        timerRef.current = setTimeout(() => {
          refreshWithThrottle(true);
        }, 100); // Small delay to collate multiple events
      }
    };
    
    // Listen for cafe stats updated events specifically
    const handleStatsUpdated = () => {
      // Debounce the refresh - clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Set a new timer to refresh after a delay
      timerRef.current = setTimeout(() => {
        refreshWithThrottle(true);
      }, 100);
    };
    
    // Initial refresh on mount
    refreshWithThrottle();
    
    // Set up event listeners
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
