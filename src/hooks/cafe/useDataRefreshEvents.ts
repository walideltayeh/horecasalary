
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for setting up event listeners for data refresh events
 * Implements improved debouncing with lower throttling for critical updates
 */
export const useDataRefreshEvents = (
  onRefresh: (force?: boolean) => Promise<void>
) => {
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const pendingRefreshRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean, debounced refresh function with improved debouncing
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
      
      // Reduced throttling from 15s to 5s for non-forced refreshes
      // Skip if not forced and we refreshed recently
      if (!force && now - lastRefreshTimeRef.current < 5000) {
        console.log("Refresh skipped due to recent refresh");
        return;
      }
      
      try {
        refreshInProgressRef.current = true;
        lastRefreshTimeRef.current = now;
        
        await onRefresh(force);
        
        // Check if another refresh was requested while we were refreshing
        if (pendingRefreshRef.current) {
          pendingRefreshRef.current = false;
          // Reduced delay before executing the pending refresh
          setTimeout(() => {
            debouncedRefresh(false);
          }, 1500);
        }
      } catch (error) {
        console.error("Error in debouncedRefresh:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    }, 800); // Reduced debounce delay for better responsiveness
  }, [onRefresh]);
  
  // Set up event listeners for data updates with improved throttling
  const setupEventListeners = useCallback(() => {
    console.log("Setting up cafe data event listeners with improved throttling...");
    
    // Listen for manual refresh requests
    const handleRefreshRequested = (event: CustomEvent) => {
      const force = event.detail?.force === true;
      console.log(`Manual refresh requested, force: ${force}`);
      debouncedRefresh(force);
    };
    
    // Listen for data update events with better handling for critical events
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Determine if this is a critical update that should force a refresh
      const isCriticalUpdate = 
        detail.forceRefresh === true ||
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeCreated' || 
        detail.action === 'cafeEdited';
      
      if (isCriticalUpdate) {
        console.log("Critical data update detected:", detail.action);
        debouncedRefresh(true); // Force refresh for critical updates
      } else if (!detail.action) {
        // For general updates, refresh but don't force
        console.log("General data update detected");
        debouncedRefresh(false);
      } else {
        console.log("Non-critical update detected:", detail.action);
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
