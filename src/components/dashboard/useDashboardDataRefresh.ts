
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(Date.now());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add effect to listen for data updates with improved throttling
  useEffect(() => {
    const handleDataUpdated = (event: any) => {
      console.log("Dashboard detected data update event", event.detail);
      
      // Prevent multiple refreshes in quick succession with stronger throttling
      if (refreshInProgressRef.current) {
        console.log("Dashboard refresh already in progress, skipping");
        return;
      }
      
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < 5000) { // Increased to 5 seconds
        console.log("Dashboard refresh throttled");
        return;
      }
      
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Add slight delay before refreshing
      refreshTimeoutRef.current = setTimeout(() => {
        refreshInProgressRef.current = true;
        lastRefreshTimeRef.current = Date.now();
        console.log("Dashboard initiating data refresh");
        
        // Show toast for status updates (only when it's a status update)
        if (event.detail?.action === 'statusUpdate') {
          const { cafeId, newStatus } = event.detail;
          toast.info(`Cafe status updated to ${newStatus}`, {
            id: `status-update-${cafeId}`,
            duration: 2000  // 2 seconds is enough
          });
        }
        
        // Refresh data when update event is detected
        refreshCafes();
        
        // Reset flag after delay
        setTimeout(() => {
          refreshInProgressRef.current = false;
        }, 1000);  // Increased to 1 second
      }, 300);
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshCafes]);
  
  // Add effect to refresh data on component mount, but only once
  useEffect(() => {
    console.log("Dashboard mounted, refreshing data");
    refreshCafes();
  }, []); // Removed refreshCafes from dependencies to prevent double-refresh
};
