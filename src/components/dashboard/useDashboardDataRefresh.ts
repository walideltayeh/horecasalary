
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  const refreshInProgressRef = useRef(false);
  
  // Add effect to listen for data updates
  useEffect(() => {
    const handleDataUpdated = (event: any) => {
      console.log("Dashboard detected data update event", event.detail);
      
      // Prevent multiple refreshes in quick succession
      if (refreshInProgressRef.current) {
        console.log("Dashboard refresh already in progress, skipping");
        return;
      }
      
      refreshInProgressRef.current = true;
      console.log("Dashboard initiating data refresh");
      
      // Refresh data when update event is detected
      refreshCafes();
      
      // Reset flag after short delay
      setTimeout(() => {
        refreshInProgressRef.current = false;
      }, 500);
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
    };
  }, [refreshCafes]);
  
  // Add effect to refresh data on component mount
  useEffect(() => {
    console.log("Dashboard mounted, refreshing data");
    refreshCafes();
  }, [refreshCafes]);
};
