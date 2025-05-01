
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

export const useCafeRefresh = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { refreshCafes } = useData();
  
  const handleRefresh = async (force = false) => {
    if (refreshing && !force) return; // Prevent multiple refreshes unless forced
    
    setRefreshing(true);
    console.log("Refreshing cafe data from server...");
    
    try {
      await refreshCafes();
      console.log("Data refreshed successfully");
      
      // Dispatch a global refresh event to ensure all components update
      window.dispatchEvent(new CustomEvent('global_data_refresh'));
      
      if (force) {
        toast.success("Data refreshed from server");
      }
    } catch (error) {
      console.error("Error during refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };
  
  return { refreshing, handleRefresh };
};
