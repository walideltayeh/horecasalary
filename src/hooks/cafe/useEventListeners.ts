
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
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Determine if this is a critical update that should force a refresh
      const isCriticalUpdate = 
        detail.forceRefresh === true ||
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeCreated' || 
        detail.action === 'cafeEdited';
      
      if (isCriticalUpdate) {
        console.log("CafeList detected critical data update event:", detail.action);
        
        // Reduced throttling for critical updates to 3 seconds
        const now = Date.now();
        if (now - lastRefreshTime.current < 3000) { 
          console.log("Critical refresh throttled but scheduled for execution soon");
          
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          // Schedule refresh soon
          refreshTimeoutRef.current = setTimeout(() => {
            console.log("Executing throttled critical refresh");
            lastRefreshTime.current = Date.now();
            if (mounted.current && !refreshing && handleRefresh) {
              handleRefresh();
            }
          }, 3000);
          
          return;
        }
        
        if (mounted.current && !refreshing && handleRefresh) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          // Execute immediately for critical updates
          console.log("Triggering immediate refresh for critical update");
          lastRefreshTime.current = Date.now();
          handleRefresh();
        }
      } else if (!detail.action) {
        // For general updates with reduced throttling
        const now = Date.now();
        if (now - lastRefreshTime.current < 8000) { // 8 second cooldown for non-critical
          console.log("General refresh throttled");
          return;
        }
        
        if (mounted.current && !refreshing && handleRefresh) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          // Use timeout to debounce multiple events
          refreshTimeoutRef.current = setTimeout(() => {
            console.log("Triggering refresh for general update");
            lastRefreshTime.current = Date.now();
            handleRefresh();
          }, 1000); // 1 second debounce
        }
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
          }, 2000); // Reduced delay to 2s
        }
      }
    };
    
    // Add a direct refresh handler
    const handleRefreshRequested = (event: CustomEvent) => {
      const force = event.detail?.force === true;
      
      if (force) {
        console.log("Forced refresh requested, executing immediately");
        if (mounted.current && handleRefresh) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          lastRefreshTime.current = Date.now();
          handleRefresh();
        }
      } else {
        console.log("Normal refresh requested");
        // Use standard debouncing
        if (mounted.current && !refreshing && handleRefresh) {
          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          refreshTimeoutRef.current = setTimeout(() => {
            lastRefreshTime.current = Date.now();
            handleRefresh();
          }, 800);
        }
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
