
import { useState, useCallback, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateRole } from '@/utils/authUtils';

export function useUsers(isAdmin: boolean, authenticated: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Fetch users from Supabase Auth system
  const fetchUsers = useCallback(async (force: boolean = false) => {
    // Don't fetch if not admin or not authenticated
    if (!isAdmin || !authenticated) {
      console.log("[useUsers] Not fetching users - not admin or not authenticated");
      return;
    }

    // Debounce frequent fetches unless force=true
    const now = Date.now();
    if (!force && now - lastFetchTime < 1000) {
      console.log("[useUsers] Debouncing fetch request, last fetch was", (now - lastFetchTime), "ms ago");
      return;
    }

    try {
      console.log("[useUsers] Starting user fetch, isAdmin:", isAdmin, "authenticated:", authenticated);
      setIsLoadingUsers(true);
      setError(null);
      setLastFetchTime(now);
      
      // Call admin function to list users
      const { data, error } = await supabase.functions.invoke('admin', {
        method: 'POST',
        body: { action: 'listUsers' }
      });
      
      console.log("[useUsers] Raw response from admin function:", data, error);
      
      // Handle errors
      if (error) {
        console.error("[useUsers] Error fetching users:", error);
        setError(typeof error === 'string' ? error : error.message || 'Failed to fetch users');
        toast.error(typeof error === 'string' ? error : error.message || 'Failed to fetch users');
        return;
      }
      
      if (data?.error) {
        console.error("[useUsers] Error from admin function:", data.error);
        setError(typeof data.error === 'string' ? data.error : 'Failed to fetch users');
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to fetch users');
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
        
        console.log("[useUsers] Final mapped users:", mappedUsers);
        setUsers(mappedUsers);
      } else {
        console.error("[useUsers] No users data in response:", data);
        setError("Could not retrieve user data");
        toast.error("Could not retrieve user data");
      }
    } catch (err: any) {
      console.error("[useUsers] Error fetching users:", err);
      setError(typeof err === 'string' ? err : err.message || 'Failed to fetch users');
      toast.error(typeof err === 'string' ? err : err.message || 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAdmin, authenticated, lastFetchTime]);

  // Poll for users when admin and authenticated
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("[useUsers] Setting up polling, isAdmin:", isAdmin, "authenticated:", authenticated);
      // Initial fetch
      fetchUsers(true);
      
      // Set up polling with shorter interval
      const intervalId = setInterval(() => {
        console.log("[useUsers] Polling for user updates");
        fetchUsers(true);
      }, 5000); // Poll every 5 seconds for better reactivity
      
      return () => {
        console.log("[useUsers] Cleaning up polling interval");
        clearInterval(intervalId);
      };
    } else {
      console.log("[useUsers] Not setting up polling, isAdmin:", isAdmin, "authenticated:", authenticated);
    }
  }, [isAdmin, authenticated, fetchUsers]);

  return { users, setUsers, isLoadingUsers, error, fetchUsers };
}
