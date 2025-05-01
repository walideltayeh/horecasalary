
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';

export const useCafeRefresh = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { refreshCafes } = useData();
  
  const handleRefresh = async () => {
    if (refreshing) return; // Prevent multiple refreshes
    
    setRefreshing(true);
    console.log("Refreshing cafe data from server...");
    
    try {
      await refreshCafes();
      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  return { refreshing, handleRefresh };
};
