
import { useState, useCallback, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { validateRole } from '@/utils/authUtils';

export function useUsers(isAdmin: boolean, authenticated: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [fetchCount, setFetchCount] = useState<number>(0);

  // Fetch users from Supabase Auth system
  const fetchUsers = useCallback(async (force: boolean = false) => {
    // Don't fetch if not admin or not authenticated
    if (!isAdmin || !authenticated) {
      console.log("[useUsers] Not fetching users - not admin or not authenticated", {isAdmin, authenticated});
      return;
    }

    // Debounce frequent fetches unless force=true
    const now = Date.now();
    if (!force && now - lastFetchTime < 5000) {
      console.log("[useUsers] Debouncing fetch request, last fetch was", (now - lastFetchTime), "ms ago");
      return;
    }

    try {
      console.log("[useUsers] Starting user fetch attempt #", fetchCount + 1, "isAdmin:", isAdmin, "authenticated:", authenticated);
      setIsLoadingUsers(true);
      setError(null);
      setLastFetchTime(now);
      setFetchCount(prev => prev + 1);
      
      // Call admin function to list users with explicit timeout
      const fetchPromise = supabase.functions.invoke('admin', {
        method: 'POST',
        body: { action: 'listUsers' },
      });
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
      });
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      console.log("[useUsers] Raw response from admin function:", data, error);
      
      // Handle errors
      if (error) {
        console.error("[useUsers] Error fetching users:", error);
        setError(typeof error === 'string' ? error : error.message || 'Failed to fetch users');
        toast.error(`Failed to fetch users: ${typeof error === 'string' ? error : error.message || 'Unknown error'}`);
        return;
      }
      
      if (data?.error) {
        console.error("[useUsers] Error from admin function:", data.error);
        setError(typeof data.error === 'string' ? data.error : 'Failed to fetch users');
        toast.error(`Failed to fetch users: ${typeof data.error === 'string' ? data.error : 'Unknown error'}`);
        return;
      }
      
      // Parse and format user data
      if (data?.data?.users) {
        const mappedUsers = data.data.users.map(authUser => {
          const metadata = authUser.user_metadata || {};
          console.log("[useUsers] Processing user:", authUser.id, "metadata:", metadata);
          
          const formattedUser = {
            id: authUser.id,
            email: authUser.email || '',
            name: metadata.name || authUser.email?.split('@')[0] || 'User',
            role: validateRole(metadata.role || 'user'),
            password: null
          };
          
          console.log("[useUsers] Formatted user:", formattedUser);
          return formattedUser;
        });
        
        console.log("[useUsers] Final mapped users:", mappedUsers.length, mappedUsers);
        setUsers(mappedUsers);
        
        if (mappedUsers.length === 0) {
          console.warn("[useUsers] No users returned from API");
          toast.warning("No users found. There might be an issue with user data fetching.");
        }
      } else {
        console.error("[useUsers] No users data in response:", data);
        setError("Could not retrieve user data");
        toast.error("Could not retrieve user data from server");
      }
    } catch (err: any) {
      console.error("[useUsers] Error fetching users:", err);
      setError(typeof err === 'string' ? err : err.message || 'Failed to fetch users');
      toast.error(`Error fetching users: ${typeof err === 'string' ? err : err.message || 'Unknown error'}`);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAdmin, authenticated, lastFetchTime, fetchCount]);

  // Poll for users when admin and authenticated - but with more aggressive initial fetch
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("[useUsers] Setting up polling, isAdmin:", isAdmin, "authenticated:", authenticated);
      // Initial fetch immediately
      fetchUsers(true);
      
      // Try again after 2 seconds if first attempt fails
      const initialRetryTimeout = setTimeout(() => {
        console.log("[useUsers] Performing initial retry fetch");
        fetchUsers(true);
      }, 2000);
      
      // Set up polling with shorter interval for better reactivity
      const intervalId = setInterval(() => {
        console.log("[useUsers] Polling for user updates");
        fetchUsers(true); // Force refresh every time for admins
      }, 10000); // Reduced polling frequency to 10 seconds
      
      return () => {
        console.log("[useUsers] Cleaning up polling interval");
        clearTimeout(initialRetryTimeout);
        clearInterval(intervalId);
      };
    } else {
      console.log("[useUsers] Not setting up polling, isAdmin:", isAdmin, "authenticated:", authenticated);
    }
  }, [isAdmin, authenticated, fetchUsers]);

  return { users, setUsers, isLoadingUsers, error, fetchUsers };
}
