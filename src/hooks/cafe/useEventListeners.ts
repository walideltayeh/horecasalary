
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
  
  // Set up listeners for data update events with much stronger throttling
  useEffect(() => {
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Only respond to specific events, ignore generic refreshes
      const isCriticalUpdate = 
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeCreated' || 
        detail.action === 'cafeEdited' ||
        detail.action === 'cafeDeleted';
      
      if (isCriticalUpdate) {
        console.log("CafeList detected critical data update event:", detail.action);
        
        // Heavy throttling for critical updates to 10 seconds (was 3 seconds)
        const now = Date.now();
        if (now - lastRefreshTime.current < 10000) { 
          console.log("Critical refresh throttled, skipping");
          return;
        }
        
        if (mounted.current && !refreshing && handleRefresh) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          // Execute refresh for critical updates
          console.log("Triggering refresh for critical update");
          lastRefreshTime.current = Date.now();
          handleRefresh();
        }
      } else {
        // Ignore non-critical updates completely
        console.log("Ignoring non-critical update:", detail);
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
          }, 2000);
        }
      }
    };
    
    // Modify direct refresh handler to heavily throttle requests
    const handleRefreshRequested = (event: CustomEvent) => {
      const force = event.detail?.force === true;
      
      // Only respond to forced refresh requests
      if (force) {
        const now = Date.now();
        if (now - lastRefreshTime.current < 10000) { 
          console.log("Forced refresh throttled, skipping");
          return;
        }
        
        console.log("Forced refresh requested, executing");
        if (mounted.current && handleRefresh) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          lastRefreshTime.current = Date.now();
          handleRefresh();
        }
      } else {
        console.log("Normal refresh requested but ignored");
      }
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
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
