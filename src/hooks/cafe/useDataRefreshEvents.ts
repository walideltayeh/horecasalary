
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
  
  // Clean, debounced refresh function
  const debouncedRefresh = useCallback(async (force?: boolean) => {
    const now = Date.now();
    
    // If a refresh is already in progress, mark that we need another one when it finishes
    if (refreshInProgressRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    
    // Skip if not forced and we refreshed recently (within 2 seconds)
    if (!force && now - lastRefreshTimeRef.current < 2000) {
      return;
    }
    
    try {
      refreshInProgressRef.current = true;
      lastRefreshTimeRef.current = now;
      
      await onRefresh(force);
      
      // Check if another refresh was requested while we were refreshing
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        // Small delay before executing the pending refresh
        setTimeout(() => {
          debouncedRefresh(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error in debouncedRefresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [onRefresh]);
  
  // Set up all event listeners for data updates
  const setupEventListeners = useCallback(() => {
    console.log("Setting up cafe data event listeners...");
    
    // Listen for manual refresh requests
    const handleRefreshRequested = () => {
      console.log("Manual refresh requested");
      debouncedRefresh(true);
    };
    
    // Listen for data update events (within same tab)
    const handleDataUpdated = () => {
      console.log("Data updated event received");
      debouncedRefresh(false); // Not forcing refresh on every event
    };
    
    // Listen for cafe deletion events (special handling)
    const handleCafeDeleted = (event: CustomEvent) => {
      console.log(`Cafe deleted event received for ID: ${event.detail?.cafeId}`);
      // Delay refresh slightly to allow UI to update first
      setTimeout(() => {
        debouncedRefresh(true);
      }, 1000);
    };
    
    // Listen for storage events (across tabs)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'cafe_data_updated' || event.key === 'last_deleted_cafe') {
        console.log("Storage event: cafe data updated");
        debouncedRefresh(false);
      }
    };
    
    // Register all listeners
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested);
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('cafe_deleted', handleCafeDeleted as EventListener);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      // Clean up all listeners
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested);
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('cafe_deleted', handleCafeDeleted as EventListener);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [debouncedRefresh]);

  return { setupEventListeners };
};
