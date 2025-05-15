
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for setting up event listeners for data refresh events
 * With optimized refresh frequency and proper cleanup
 */
export const useDataRefreshEvents = (
  onRefresh: (force?: boolean) => Promise<void>
) => {
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const pendingRefreshRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean, optimized debounced refresh function
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
      
      // Apply throttling - 5 seconds between non-forced refreshes
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
          setTimeout(() => {
            debouncedRefresh(false);
          }, 1000);
        }
      } catch (error) {
        console.error("Error in debouncedRefresh:", error);
      } finally {
        refreshInProgressRef.current = false;
      }
    }, 300); // Reduced debounce time for better responsiveness
  }, [onRefresh]);
  
  // Set up event listeners for data updates
  const setupEventListeners = useCallback(() => {
    // Handle refresh requests with proper throttling
    const handleRefreshRequested = (event: CustomEvent) => {
      const force = event.detail?.force === true;
      debouncedRefresh(force);
    };
    
    // Handle specific cafe added events with high priority
    const handleCafeAdded = () => {
      console.log("Cafe added event detected in DataRefreshEvents");
      // Always treat cafe additions as forced refreshes
      debouncedRefresh(true);
    };
    
    // Handle data updated events
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
      // Check for critical updates that should force a refresh
      const isCriticalUpdate = 
        detail.forceRefresh === true ||
        detail.highPriority === true ||
        detail.action === 'statusUpdate' || 
        detail.action === 'cafeAdded';
      
      debouncedRefresh(isCriticalUpdate);
    };
    
    // Handle forced refresh events
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
