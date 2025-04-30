
import { useEffect, useRef } from 'react';

/**
 * Hook for setting up periodic refresh of cafe data
 * With much less aggressive refresh intervals
 */
export const usePeriodicRefresh = (
  onRefresh: (force?: boolean) => Promise<void>,
  isAdminRef: React.MutableRefObject<boolean>
) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAutoRefreshRef = useRef<number>(0);
  
  // Set up a periodic refresh based on user role with much less frequent updates
  useEffect(() => {
    const setupRefreshInterval = () => {
      // Clear existing interval if any
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Set refresh interval based on user role - much less frequent now
      const refreshInterval = isAdminRef.current ? 120000 : 180000; // 2 minutes for admin, 3 minutes for regular users
      
      // Create new interval
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        
        // Avoid refreshing too frequently
        if (now - lastAutoRefreshRef.current > refreshInterval) {
          console.log(`Auto-refreshing cafe data (as ${isAdminRef.current ? 'admin' : 'regular user'})`);
          lastAutoRefreshRef.current = now;
          
          // Use a custom event instead of direct refresh for better decoupling
          window.dispatchEvent(new CustomEvent('horeca_data_refresh_requested'));
        }
      }, refreshInterval);
      
      console.log(`Periodic refresh set up with interval: ${refreshInterval}ms`);
    };
    
    setupRefreshInterval();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAdminRef]);
};
