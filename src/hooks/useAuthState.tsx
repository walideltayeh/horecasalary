
import { useAuthSession } from './auth/useAuthSession';
import { useUsers } from './auth/useUsers';

/**
 * Main authentication state hook that combines session and users data
 * @returns Combined authentication state
 */
export function useAuthState() {
  const { user, isLoading, session } = useAuthSession();
  
  // Enhanced admin detection - explicitly check for admin role
  const isAdmin = !!user && user.role === 'admin';
  console.log("useAuthState - User:", user?.id, "isAdmin:", isAdmin);
  
  // Pass isAdmin and loading status to useUsers with enhanced debugging
  const { users, setUsers, isLoadingUsers, error, fetchUsers } = useUsers(isAdmin, !isLoading);

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
    // Explicitly include isAdmin in the return value
    isAdmin 
  };
}
