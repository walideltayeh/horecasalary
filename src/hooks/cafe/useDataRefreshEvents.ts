
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for setting up event listeners for data refresh events
 * With drastically reduced refresh frequency
 */
export const useDataRefreshEvents = (
  onRefresh: (force?: boolean) => Promise<void>
) => {
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const pendingRefreshRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean, highly debounced refresh function
  const debouncedRefresh = useCallback(async (force?: boolean) => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    debounceTimeoutRef.current = setTimeout(async () => {
      const now = Date.now();
      
      // If a refresh is already in progress, mark that we need another one when it finishes
      if (refreshInProgressRef.current) {
        pendingRefreshRef.current = true;
        return;
      }
      
      // Reduce throttling - now only 10 seconds (was 30 seconds)
      if (!force && now - lastRefreshTimeRef.current < 10000) {
        return;
      }
      
      try {
        refreshInProgressRef.current = true;
        lastRefreshTimeRef.current = now;
        
        await onRefresh(force);
        
        // Check if another refresh was requested while we were refreshing
        if (pendingRefreshRef.current) {
          pendingRefreshRef.current = false;
          setTimeout(() => {
            debouncedRefresh(false);
          }, 2000); // Reduced from 5s to 2s
        }
      } catch (error) {
        console.error("Error in debouncedRefresh:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    }, 500); // Reduced from 2000ms to 500ms
  }, [onRefresh]);
  
  // Set up event listeners for data updates
  const setupEventListeners = useCallback(() => {
    // Listen for manual refresh requests with reduced throttling
    const handleRefreshRequested = (event: CustomEvent) => {
      const now = Date.now();
      const force = event.detail?.force === true;
      
      // Reduce throttling for non-forced refreshes to 5 seconds (was 10 seconds)
      if (!force && now - lastRefreshTimeRef.current < 5000) {
        console.log("Throttling refresh request - too soon since last refresh");
        return;
      }
      
      debouncedRefresh(force);
    };
    
    // Handle specific cafe added events with high priority
    const handleCafeAdded = (event: CustomEvent) => {
      console.log("Cafe added event detected in DataRefreshEvents", event.detail);
      // Always treat cafe additions as forced refreshes to bypass throttling
      debouncedRefresh(true);
    };
    
    // Listen for data update events with reduced throttling
    const handleDataUpdated = (event: CustomEvent) => {
      const now = Date.now();
      const detail = event.detail || {};
      
      // Reduce throttle time to 5 seconds (was 10 seconds)
      if (now - lastRefreshTimeRef.current < 5000) {
        console.log("Throttling data update - too soon since last refresh");
        return;
      }
      
      // Explicitly check for cafe addition events
      const isCafeAddition = detail.action === 'cafeAdded';
      
      // Determine if this is a critical update that should force a refresh
      const isCriticalUpdate = 
        detail.forceRefresh === true ||
        detail.highPriority === true ||
        detail.action === 'statusUpdate' || 
        isCafeAddition;
      
      if (isCriticalUpdate) {
        console.log("Critical update detected:", detail.action);
        debouncedRefresh(true); // Force refresh for critical updates
      } else {
        debouncedRefresh(false);
      }
    };
    
    // Listen for forced refresh events
    const handleForceRefresh = () => {
      console.log("Force refresh event received");
      debouncedRefresh(true);
    };
    
    // Register listeners
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
    window.addEventListener('horeca_data_updated', handleDataUpdated as EventListener);
    window.addEventListener('cafe_added', handleCafeAdded as EventListener);
    window.addEventListener('cafe_data_force_refresh', handleForceRefresh as EventListener);
    
    return () => {
      // Clean up all listeners
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
      window.removeEventListener('horeca_data_updated', handleDataUpdated as EventListener);
      window.removeEventListener('cafe_added', handleCafeAdded as EventListener);
      window.removeEventListener('cafe_data_force_refresh', handleForceRefresh as EventListener);
      
      // Clear any pending timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [debouncedRefresh]);

  return { setupEventListeners };
};
