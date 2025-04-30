
import { useEffect, useRef } from 'react';
import { Cafe } from '@/types';

export const useEventListeners = (
  setLocalCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  refreshing: boolean,
  deleteInProgress: string | null,
  handleRefresh?: () => Promise<void>
) => {
  const mounted = useRef(true);
  const lastRefreshTime = useRef(Date.now());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set up listeners for data update events with improved throttling
  useEffect(() => {
    const handleDataUpdated = () => {
      console.log("CafeList detected data update event");
      
      // Strong throttling to prevent cascading refreshes
      const now = Date.now();
      if (now - lastRefreshTime.current < 5000) { // 5 second cooldown
        console.log("Refresh throttled due to recent update");
        return;
      }
      
      if (mounted.current && !refreshing && handleRefresh) {
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Use timeout to debounce multiple events
        refreshTimeoutRef.current = setTimeout(() => {
          console.log("Triggering refresh due to data update event");
          lastRefreshTime.current = Date.now();
          handleRefresh();
        }, 1000); // 1 second debounce
      }
    };
    
    const handleCafeDeleted = (event: CustomEvent) => {
      const { cafeId } = event.detail;
      console.log(`CafeList detected cafe deletion event for ID: ${cafeId}`);
      
      // Update local state immediately for better responsiveness
      if (mounted.current) {
        setLocalCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
        
        // Also trigger a refresh to ensure data consistency but with delay
        if (handleRefresh && !refreshing) {
          console.log("Scheduling refresh after deletion event");
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          // Use timeout to debounce multiple events
          refreshTimeoutRef.current = setTimeout(() => {
            console.log("Executing refresh after deletion");
            lastRefreshTime.current = Date.now();
            handleRefresh();
          }, 1500); // Increased delay to 1.5s
        }
      }
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshing, deleteInProgress, setLocalCafes, handleRefresh]);
  
  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
  
  return mounted;
};
