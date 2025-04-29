
import { useEffect, useRef } from 'react';

/**
 * Hook that sets up refresh on data events rather than continuous polling
 */
export const usePeriodicRefresh = (
  onRefresh: (force?: boolean) => Promise<void>,
  isAdmin: React.MutableRefObject<boolean>
) => {
  const lastRefreshTimeRef = useRef<number>(0);

  // Replace periodic refresh with event-based refresh
  useEffect(() => {
    // Initial fetch once on mount
    onRefresh(false);
    
    // Set up event listeners for data changes
    const handleDataUpdated = () => {
      const now = Date.now();
      // Debounce rapid updates (minimum 2 seconds between refreshes)
      if (now - lastRefreshTimeRef.current > 2000) {
        console.log("Event-based refresh triggered");
        lastRefreshTimeRef.current = now;
        onRefresh(false);
      }
    };
    
    // Listen for data update events
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
    };
  }, [onRefresh]);
};
