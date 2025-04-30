
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for setting up event listeners for data refresh events
 */
export const useDataRefreshEvents = (
  onRefresh: (force?: boolean) => Promise<void>
) => {
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const pendingRefreshRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean, debounced refresh function
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
      
      // Skip if not forced and we refreshed recently
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
    }, 500);
  }, [onRefresh]);
  
  // Set up event listeners for data updates
  const setupEventListeners = useCallback(() => {
    // Listen for manual refresh requests
    const handleRefreshRequested = (event: CustomEvent) => {
      const force = event.detail?.force === true;
      debouncedRefresh(force);
    };
    
    // Listen for data update events
    const handleDataUpdated = (event: CustomEvent) => {
      const detail = event.detail || {};
      
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
