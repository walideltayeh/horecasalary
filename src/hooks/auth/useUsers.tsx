import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage users data with admin privileges
 * @param isAdmin Boolean flag indicating if the user is an admin
 * @param isAuthenticated Boolean flag indicating if the user is authenticated
 * @returns Object containing users data and loading state
 */
export function useUsers(isAdmin: boolean, isAuthenticated: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false); // Track loading state across renders

  // Use useRef to persist isAdmin and isAuthenticated values
  const isAdminRef = useRef(isAdmin);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // Update the refs when isAdmin or isAuthenticated changes
  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const fetchUserData = useCallback(async (force = false) => {
    console.log(`Fetching users with force=${force}, isAdmin=${isAdmin}, isAuthenticated=${isAuthenticated}`);
    
    // Skip fetch if not admin or not authenticated, unless forced
    if ((!isAdmin || !isAuthenticated) && !force) {
      console.log("Skipping user fetch - not admin, not authenticated, or not forced");
      return;
    }
    
    if (isLoadingRef.current && !force) {
      console.log("Skipping user fetch - already loading");
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log("Invoking RPC get_users");
      
      // Use the RPC function that's protected by RLS
      const { data, error } = await supabase.rpc('get_users', {}, {
        // Remove the 'signal' property as it doesn't exist in FunctionInvokeOptions
      });
      
      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      
      if (Array.isArray(data)) {
        console.log(`Fetched ${data.length} users`);
        data.sort((a, b) => {
          // Sort to put admin users first
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          
          // Then sort by name
          return a.name.localeCompare(b.name);
        });
        
        setUsers(data);
      } else {
        console.error("Unexpected data format:", data);
        throw new Error("Unexpected data format returned from server");
      }
    } catch (error: any) {
      console.error("Error in fetchUserData:", error);
      setError(error.message || "Failed to load users");
      // Return empty array on error
      setUsers([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [isAdmin, isAuthenticated]);

  // Fetch users on mount and when isAdmin or isAuthenticated changes
  useEffect(() => {
    // Initial fetch
    fetchUserData();
  }, [fetchUserData]);

  return { users, setUsers, isLoading, error, fetchUsers: fetchUserData };
}
