
import { useAuthSession } from './auth/useAuthSession';
import { useUsers } from './auth/useUsers';
import { useState, useEffect, useRef } from 'react';

export function useAuthState() {
  const { user, isLoading, session } = useAuthSession();
  const [authError, setAuthError] = useState<string | null>(null);
  const fetchTriggeredRef = useRef(false);
  
  const isAdmin = !!user && user.role === 'admin';
  
  // Only fetch users if admin and authenticated - with stable reference
  const { users, setUsers, isLoading: isLoadingUsers, error, fetchUsers } = useUsers(
    isAdmin, 
    !isLoading && !!user
  );

  // Simplified user fetch function
  const fetchUsersSimple = async (force: boolean = false) => {
    if (!isAdmin || isLoading || fetchTriggeredRef.current) {
      return;
    }
    
    try {
      setAuthError(null);
      fetchTriggeredRef.current = true;
      await fetchUsers(force);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setAuthError(err.message || "Failed to load user data");
    } finally {
      fetchTriggeredRef.current = false;
    }
  };

  // Single effect for admin user fetch - no dependency on users.length
  useEffect(() => {
    if (isAdmin && !isLoading && !fetchTriggeredRef.current) {
      console.log("AuthState: Admin detected, scheduling user fetch");
      // Use setTimeout to prevent blocking the main thread
      const timer = setTimeout(() => {
        fetchUsersSimple(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fetchTriggeredRef.current = false;
    };
  }, []);

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
