
import { useEffect, useCallback, useRef } from 'react';

/**
 * Simplified hook for data refresh events with proper throttling
 */
export const useDataRefreshEvents = (
  onRefresh: (force?: boolean) => Promise<void>
) => {
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Heavily throttled refresh function to prevent loops
  const debouncedRefresh = useCallback(async (force?: boolean) => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    debounceTimeoutRef.current = setTimeout(async () => {
      const now = Date.now();
      
      // Skip if refresh is in progress
      if (refreshInProgressRef.current) {
        console.log("Refresh already in progress, skipping");
        return;
      }
      
      // Heavy throttling: 30 seconds minimum between refreshes
      if (!force && now - lastRefreshTimeRef.current < 30000) {
        console.log("Throttling refresh - too soon since last refresh");
        return;
      }
      
      try {
        refreshInProgressRef.current = true;
        lastRefreshTimeRef.current = now;
        
        await onRefresh(force);
        
      } catch (error) {
        console.error("Error in debouncedRefresh:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    }, 2000); // 2 second debounce
  }, [onRefresh]);
  
  // Minimal event listeners to prevent loops
  const setupEventListeners = useCallback(() => {
    // Only listen to critical refresh events
    const handleForceRefresh = () => {
      console.log("Force refresh event received");
      debouncedRefresh(true);
    };
    
    // Register only essential listeners
    window.addEventListener('cafe_data_force_refresh', handleForceRefresh as EventListener);
    
    return () => {
      // Clean up listeners
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
