
import { useAuthSession } from './auth/useAuthSession';
import { useUsers } from './auth/useUsers';
import { useEffect } from 'react';

/**
 * Main authentication state hook that combines session and users data
 * @returns Combined authentication state
 */
export function useAuthState() {
  const { user, isLoading, session } = useAuthSession();
  
  // Enhanced admin detection - explicitly check for admin role
  const isAdmin = !!user && user.role === 'admin';
  
  // Pass isAdmin and auth status to useUsers with enhanced debugging
  const { users, setUsers, isLoadingUsers, error, fetchUsers } = useUsers(
    isAdmin, 
    !isLoading && !!user // Only consider authenticated when we have a user and are not loading
  );

  // Debug logging for authentication state
  useEffect(() => {
    console.log("Auth state:", {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      isAdmin,
      isLoading,
      sessionExists: !!session
    });
  }, [user, isAdmin, isLoading, session]);

  // Forward the fetchUsers function call with its parameter
  const fetchUsersWithForce = (force: boolean = false) => {
    console.log("Fetching users with force =", force, "isAdmin =", isAdmin);
    return fetchUsers(force);
  };

  return { 
    user, 
    users, 
    setUsers, 
    isLoading, 
    isLoadingUsers, 
    error,
    session, 
    fetchUsers: fetchUsersWithForce,
    isAdmin 
  };
}
