
import { useEffect, useRef } from 'react';
import { Cafe } from '@/types';

export const useEventListeners = (
  setLocalCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  refreshing: boolean,
  deleteInProgress: string | null,
  handleRefresh?: () => Promise<void>
) => {
  const mounted = useRef(true);
  
  // Set up listeners for data update events
  useEffect(() => {
    const handleDataUpdated = () => {
      console.log("CafeList detected data update event");
      if (mounted.current && !refreshing && handleRefresh) {
        // Actually trigger refresh when data update event is detected
        console.log("Triggering refresh due to data update event");
        handleRefresh();
      }
    };
    
    const handleCafeDeleted = (event: CustomEvent) => {
      const { cafeId } = event.detail;
      console.log(`CafeList detected cafe deletion event for ID: ${cafeId}`);
      
      // Update local state immediately for better responsiveness
      if (mounted.current) {
        setLocalCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
        
        // Also trigger a refresh to ensure data consistency
        if (handleRefresh && !refreshing) {
          console.log("Triggering refresh after deletion event");
          setTimeout(() => handleRefresh(), 300);
        }
      }
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    };
  }, [refreshing, deleteInProgress, setLocalCafes, handleRefresh]);
  
  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  
  return mounted;
};
