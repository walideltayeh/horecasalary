
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for setting up event listeners for data refresh events
 * Implements stronger debouncing and prevents excessive refreshes
 */
export const useDataRefreshEvents = (
  onRefresh: (force?: boolean) => Promise<void>
) => {
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const pendingRefreshRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean, debounced refresh function with much stronger debouncing
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
      
      // Skip if not forced and we refreshed recently (increased to 15 seconds)
      if (!force && now - lastRefreshTimeRef.current < 15000) {
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
          // Increased delay before executing the pending refresh to 3 seconds
          setTimeout(() => {
            debouncedRefresh(false);
          }, 3000);
        }
      } catch (error) {
        console.error("Error in debouncedRefresh:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    }, 1500); // Increased debounce delay to 1.5s
  }, [onRefresh]);
  
  // Set up event listeners for data updates with improved throttling
  const setupEventListeners = useCallback(() => {
    console.log("Setting up cafe data event listeners with improved throttling...");
    
    // Listen for manual refresh requests
    const handleRefreshRequested = () => {
      console.log("Manual refresh requested");
      debouncedRefresh(true);
    };
    
    // Listen for data update events (filtered to important actions)
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Only trigger refresh on important actions
      if (detail.action === 'statusUpdate' || 
          detail.action === 'cafeCreated' || 
          detail.action === 'cafeEdited') {
        console.log("Important data update detected:", detail.action);
        debouncedRefresh(false);
      } else {
        console.log("Non-critical update detected, skipping refresh");
      }
    };
    
    // Register listeners
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested);
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    
    return () => {
      // Clean up all listeners
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested);
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      
      // Clear any pending timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [debouncedRefresh]);

  return { setupEventListeners };
};
