
import { useEffect } from 'react';

/**
 * Hook that sets up periodic refresh intervals based on user role
 */
export const usePeriodicRefresh = (
  onRefresh: (force?: boolean) => Promise<void>,
  isAdmin: React.MutableRefObject<boolean>
) => {
  // Set up a periodic refresh with different intervals based on admin status
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log(`Periodic cafe refresh triggered (${isAdmin.current ? 'admin' : 'user'} mode)`);
      // Force refresh for admins, normal refresh for users
      onRefresh(isAdmin.current);
    }, isAdmin.current ? 20000 : 30000); // 20 seconds for admin (reduced from 5s), 30s for regular users
    
    return () => clearInterval(intervalId);
  }, [onRefresh, isAdmin]);
};
