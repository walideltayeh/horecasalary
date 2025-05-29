
import { useState, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

export const useCafeRefresh = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { refreshCafes } = useData();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleRefresh = async () => {
    // Remove throttling - allow immediate refresh
    if (refreshing) {
      console.log("Refresh already in progress, skipping");
      return; 
    }
    
    // Cancel any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    try {
      setRefreshing(true);
      console.log("Refreshing cafe data from server - no throttling");
      
      await refreshCafes();
      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error during refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };
  
  return { refreshing, handleRefresh };
};
