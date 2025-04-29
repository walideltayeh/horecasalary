
import { useEffect, useCallback } from 'react';

/**
 * Hook for setting up event listeners for data refresh events
 * Now centrally manages all refresh events
 */
export const useDataRefreshEvents = (
  onRefresh: (force?: boolean) => Promise<void>
) => {
  // Set up all event listeners for data updates
  const setupEventListeners = useCallback(() => {
    console.log("Setting up cafe data event listeners...");
    
    // Listen for manual refresh requests
    const handleRefreshRequested = () => {
      console.log("Manual refresh requested");
      onRefresh(true);
    };
    
    // Listen for data update events (within same tab)
    const handleDataUpdated = () => {
      console.log("Data updated event received");
      onRefresh(true); // Force fetch on data updates
    };
    
    // Listen for storage events (across tabs)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'cafe_data_updated') {
        console.log("Storage event: cafe data updated");
        onRefresh(true); // Force fetch on cross-tab updates
      }
    };
    
    // Register all listeners
    window.addEventListener('horeca_data_refresh_requested', handleRefreshRequested);
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      // Clean up all listeners
      window.removeEventListener('horeca_data_refresh_requested', handleRefreshRequested);
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [onRefresh]);

  return { setupEventListeners };
};
