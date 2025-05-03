
import { useState, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

export const useCafeRefresh = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { refreshCafes } = useData();
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleRefresh = async () => {
    // Prevent multiple refreshes
    if (refreshing) return; 
    
    // Add throttling - only refresh once every 5 seconds
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 5000) {
      console.log("Throttling refresh request - too soon since last refresh");
      return;
    }
    
    // Cancel any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    try {
      setRefreshing(true);
      lastRefreshTimeRef.current = now;
      console.log("Refreshing cafe data from server...");
      
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
