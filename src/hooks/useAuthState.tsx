
import { useAuthSession } from './auth/useAuthSession';
import { useUsers } from './auth/useUsers';
import { useState, useEffect } from 'react';

export function useAuthState() {
  const { user, isLoading, session } = useAuthSession();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const isAdmin = !!user && user.role === 'admin';
  
  // Only fetch users if admin and authenticated - simplified
  const { users, setUsers, isLoading: isLoadingUsers, error, fetchUsers } = useUsers(
    isAdmin, 
    !isLoading && !!user
  );

  // Simple user fetch function without retries
  const fetchUsersSimple = async (force: boolean = false) => {
    if (!isAdmin || isLoading) {
      return;
    }
    
    try {
      setAuthError(null);
      await fetchUsers(force);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setAuthError(err.message || "Failed to load user data");
    }
  };

  // Simple effect for admin user fetch - no complex retry logic
  useEffect(() => {
    if (isAdmin && !isLoading && users.length === 0) {
      // Simple timeout to avoid immediate calls
      const timer = setTimeout(() => {
        fetchUsersSimple(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isLoading, users.length]);

  return { 
    user, 
    users, 
    setUsers, 
    isLoading, 
    isLoadingUsers, 
    error: error || authError,
    session, 
    fetchUsers: fetchUsersSimple,
    isAdmin 
  };
}
