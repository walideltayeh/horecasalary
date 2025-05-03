
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
      
      // Skip if not forced and we refreshed recently - increased to 30 seconds
      if (!force && now - lastRefreshTimeRef.current < 30000) {
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
          }, 5000); // Increased from 1s to 5s
        }
      } catch (error) {
        console.error("Error in debouncedRefresh:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    }, 2000); // Increased from 500ms to 2000ms
  }, [onRefresh]);
  
  // Set up event listeners for data updates
  const setupEventListeners = useCallback(() => {
    // Listen for manual refresh requests with stronger throttling
    const handleRefreshRequested = (event: CustomEvent) => {
      const now = Date.now();
      const force = event.detail?.force === true;
      
      // Add throttling for non-forced refreshes
      if (!force && now - lastRefreshTimeRef.current < 10000) { // 10-second throttle
        console.log("Throttling refresh request - too soon since last refresh");
        return;
      }
      
      debouncedRefresh(force);
    };
    
    // Listen for data update events with stronger throttling
    const handleDataUpdated = (event: CustomEvent) => {
      const now = Date.now();
      const detail = event.detail || {};
      
      // Skip refresh if last one was too recent (unless critical update)
      if (now - lastRefreshTimeRef.current < 10000) { // 10-second throttle
        console.log("Throttling data update - too soon since last refresh");
        return;
      }
      
      // Determine if this is a critical update that should force a refresh
      const isCriticalUpdate = 
        detail.forceRefresh === true ||
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeCreated' || 
        detail.action === 'cafeEdited';
      
      if (isCriticalUpdate) {
        debouncedRefresh(true); // Force refresh for critical updates
      }
    };
    
    // Register listeners
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
    window.addEventListener('horeca_data_updated', handleDataUpdated as EventListener);
    
    return () => {
      // Clean up all listeners
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested as EventListener);
      window.removeEventListener('horeca_data_updated', handleDataUpdated as EventListener);
      
      // Clear any pending timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [debouncedRefresh]);

  return { setupEventListeners };
};
