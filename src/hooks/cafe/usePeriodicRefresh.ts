
import { useEffect, useRef } from 'react';

/**
 * Hook for setting up periodic refreshes of cafe data
 * with adaptive refresh rates based on user role
 */
export const usePeriodicRefresh = (
  refreshCafes: (force?: boolean) => Promise<void>,
  isAdminRef: React.MutableRefObject<boolean>
) => {
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshCountRef = useRef<number>(0);
  
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    // Set up initial refresh with a small delay to avoid conflicts
    const initialTimeout = setTimeout(() => {
      refreshCafes(false).catch(err => console.error('Error in initial periodic refresh:', err));
    }, 2000);
    
    // Set up periodic refresh with adaptive intervals
    refreshIntervalRef.current = setInterval(() => {
      refreshCountRef.current++;
      
      // For admin users, refresh more frequently in the first few minutes
      // then gradually reduce frequency
      const isAdmin = isAdminRef.current;
      const refreshCount = refreshCountRef.current;
      
      // Skip every other refresh after the first 10
      if (refreshCount > 10 && refreshCount % 2 !== 0) {
        console.log("Skipping periodic refresh to reduce server load");
        return;
      }
      
      // Only force refresh occasionally
      const forceRefresh = refreshCount % 5 === 0;
      
      console.log(`Periodic ${forceRefresh ? 'forced' : 'normal'} refresh (${refreshCount}), isAdmin: ${isAdmin}`);
      
      refreshCafes(forceRefresh).catch(err => console.error('Error in periodic refresh:', err));
    }, isAdminRef.current ? 45000 : 60000); // 45s for admins, 60s for regular users
    
    return () => {
      // Clean up
      clearTimeout(initialTimeout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [refreshCafes, isAdminRef]);
};
