
import { useAuthSession } from './auth/useAuthSession';
import { useUsers } from './auth/useUsers';

/**
 * Main authentication state hook that combines session and users data
 * @returns Combined authentication state
 */
export function useAuthState() {
  const { user, isLoading, session } = useAuthSession();
  const isAdmin = !!user && user.role === 'admin';
  
  // Pass isAdmin and loading status to useUsers
  const { users, setUsers, isLoadingUsers, error, fetchUsers } = useUsers(isAdmin, !isLoading);

  // Forward the fetchUsers function call with its parameter
  const fetchUsersWithForce = (force: boolean = false) => {
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
    fetchUsers: fetchUsersWithForce
  };
}
