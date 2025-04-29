
import { useEffect } from 'react';

interface DashboardDataRefreshProps {
  refreshCafes: () => void;
}

export const useDashboardDataRefresh = ({ refreshCafes }: DashboardDataRefreshProps) => {
  // Add effect to listen for data updates
  useEffect(() => {
    const handleDataUpdated = () => {
      console.log("Dashboard detected data update event");
      // Refresh data when update event is detected
      refreshCafes();
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
