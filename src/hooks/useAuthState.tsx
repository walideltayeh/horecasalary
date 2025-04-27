
import { useAuthSession } from './auth/useAuthSession';
import { useUsers } from './auth/useUsers';

export function useAuthState() {
  const { user, isLoading, session } = useAuthSession();
  const isAdmin = !!user && user.role === 'admin';
  const { users, setUsers, isLoadingUsers, error, fetchUsers } = useUsers(isAdmin, !isLoading);

  return { 
    user, 
    users, 
    setUsers, 
    isLoading, 
    isLoadingUsers, 
    error,
    session, 
    fetchUsers 
  };
}
