
import { useAuthSession } from './auth/useAuthSession';
import { useUsers } from './auth/useUsers';
import { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/networkUtils';
import { supabase } from '@/integrations/supabase/client';

/**
 * Main authentication state hook that combines session and users data
 * @returns Combined authentication state
 */
export function useAuthState() {
  const { user, isLoading, session } = useAuthSession();
  const [authError, setAuthError] = useState<string | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState(0);
  
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
      sessionExists: !!session,
      isLoadingUsers,
      usersCount: users.length
    });
    
    // If admin and not loading but users array is empty, try fetching users again
    if (isAdmin && !isLoading && !isLoadingUsers && users.length === 0 && fetchAttempt < 3) {
      // Add timeout to avoid immediate retries
      const timer = setTimeout(() => {
        console.log(`No users found but user is admin. Retry attempt ${fetchAttempt + 1}`);
        fetchUsersWithForce(true);
        setFetchAttempt(prev => prev + 1);
      }, 2000 * Math.pow(2, fetchAttempt)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, isLoading, session, users.length, isLoadingUsers, fetchAttempt]);

  // Forward the fetchUsers function call with its parameter and add retry mechanism
  const fetchUsersWithForce = async (force: boolean = false) => {
    console.log("Fetching users with force =", force, "isAdmin =", isAdmin);
    
    try {
      setAuthError(null);
      
      // Add retry mechanism for fetchUsers
      await fetchWithRetry(
        async () => {
          // Test the connection first
          const { data: testData, error: testError } = await supabase.from('users').select('count').limit(1);
          
          if (testError) {
            console.error("Error testing database connection:", testError);
            throw new Error(`Connection test failed: ${testError.message}`);
          }
          
          console.log("Connection test successful, proceeding with user fetch");
          return await fetchUsers(force);
        },
        3,  // Max 3 retries
        1000 // Start with 1 second delay
      );
    } catch (err: any) {
      console.error("Failed to fetch users after retries:", err);
      setAuthError(err.message || "Failed to load user data");
    }
  };

  return { 
    user, 
    users, 
    setUsers, 
    isLoading, 
    isLoadingUsers, 
    error: error || authError,
    session, 
    fetchUsers: fetchUsersWithForce,
    isAdmin 
  };
}
