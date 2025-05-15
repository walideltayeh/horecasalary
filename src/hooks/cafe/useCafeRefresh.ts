
import { useState, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

export const useCafeRefresh = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { refreshCafes } = useData();
  const lastRefreshTimeRef = useRef<number>(0);
  
  const handleRefresh = async () => {
    // Prevent multiple refreshes
    if (refreshing) {
      console.log("Refresh already in progress, skipping");
      return;
    }
    
    try {
      setRefreshing(true);
      lastRefreshTimeRef.current = Date.now();
      console.log("Refreshing cafe data from server...");
      
      // Always use force=true for manual refreshes
      await refreshCafes(true);
      console.log("Data refreshed successfully");
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cafe_data_force_refresh'));
    } catch (error) {
      console.error("Error during refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };
  
  return { refreshing, handleRefresh };
};
