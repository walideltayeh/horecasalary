
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

export const useCafeRefresh = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { refreshCafes } = useData();
  
  const handleRefresh = async () => {
    // URGENT FIX: Remove all throttling - allow immediate refresh
    if (refreshing) {
      console.log("URGENT FIX: Refresh already in progress, skipping");
      return; 
    }
    
    try {
      setRefreshing(true);
      console.log("URGENT FIX: Executing immediate refresh");
      
      await refreshCafes();
      console.log("URGENT FIX: Data refreshed successfully");
    } catch (error) {
      console.error("URGENT FIX: Error during refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };
  
  return { refreshing, handleRefresh };
};
