
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Hook for setting up event listeners for data refresh events
 * Implements debouncing and prevents excessive refreshes
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
      
      // Skip if not forced and we refreshed recently (increased to 5 seconds)
      if (!force && now - lastRefreshTimeRef.current < 5000) {
        return;
      }
      
      try {
        refreshInProgressRef.current = true;
        lastRefreshTimeRef.current = now;
        
        await onRefresh(force);
        
        // Check if another refresh was requested while we were refreshing
        if (pendingRefreshRef.current) {
          pendingRefreshRef.current = false;
          // Increased delay before executing the pending refresh to 1 second
          setTimeout(() => {
            debouncedRefresh(false);  // Changed to non-force for pending refreshes
          }, 1000);
        }
      } catch (error) {
        console.error("Error in debouncedRefresh:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    }, 500); // Added a 500ms debounce delay
  }, [onRefresh]);
  
  // Set up all event listeners for data updates with improved throttling
  const setupEventListeners = useCallback(() => {
    console.log("Setting up cafe data event listeners with improved throttling...");
    
    // Listen for manual refresh requests
    const handleRefreshRequested = () => {
      console.log("Manual refresh requested");
      debouncedRefresh(true);
    };
    
    // Listen for data update events (within same tab)
    const handleDataUpdated = () => {
      console.log("Data updated event received");
      debouncedRefresh(false);
    };
    
    // Register all listeners
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
