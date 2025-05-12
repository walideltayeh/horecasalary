
import { useState, useCallback, useEffect, useRef } from 'react';
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
  const requestInProgressRef = useRef<boolean>(false);

  // Fetch users from Supabase Auth system
  const fetchUsers = useCallback(async (force: boolean = false) => {
    // Don't fetch if not admin or not authenticated
    if (!isAdmin || !authenticated) {
      console.log("[useUsers] Not fetching users - not admin or not authenticated", {isAdmin, authenticated});
      return;
    }
    
    // Prevent concurrent requests
    if (requestInProgressRef.current) {
      console.log("[useUsers] A user fetch is already in progress, skipping");
      return;
    }

    // Debounce frequent fetches unless force=true
    const now = Date.now();
    if (!force && now - lastFetchTime < 30000) {
      console.log("[useUsers] Debouncing fetch request, last fetch was", (now - lastFetchTime), "ms ago");
      return;
    }

    try {
      console.log("[useUsers] Starting user fetch attempt #", fetchCount + 1);
      requestInProgressRef.current = true;
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
        setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000);
      });
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      // Handle errors
      if (error) {
        console.error("[useUsers] Error fetching users:", error);
        setError(typeof error === 'string' ? error : error.message || 'Failed to fetch users');
        return;
      }
      
      if (data?.error) {
        console.error("[useUsers] Error from admin function:", data.error);
        setError(typeof data.error === 'string' ? data.error : 'Failed to fetch users');
        return;
      }
      
      // Parse and format user data
      if (data?.data?.users) {
        const mappedUsers = data.data.users.map(authUser => {
          const metadata = authUser.user_metadata || {};
          
          return {
            id: authUser.id,
            email: authUser.email || '',
            name: metadata.name || authUser.email?.split('@')[0] || 'User',
            role: validateRole(metadata.role || 'user'),
            password: null
          };
        });
        
        console.log("[useUsers] Fetched users:", mappedUsers.length);
        setUsers(mappedUsers);
      } else {
        console.error("[useUsers] No users data in response:", data);
        setError("Could not retrieve user data");
      }
    } catch (err: any) {
      console.error("[useUsers] Error fetching users:", err);
      setError(typeof err === 'string' ? err : err.message || 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
      requestInProgressRef.current = false;
    }
  }, [isAdmin, authenticated, lastFetchTime, fetchCount]);

  // Reduced polling frequency - from every 10 seconds to every 2 minutes
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("[useUsers] Setting up polling, isAdmin:", isAdmin, "authenticated:", authenticated);
      
      // Initial fetch immediately
      fetchUsers(true);
      
      // Set up polling with longer interval for better performance
      const intervalId = setInterval(() => {
        console.log("[useUsers] Polling for user updates");
        fetchUsers(false); // Not forcing refresh on regular intervals
      }, 120000); // 2 minutes
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isAdmin, authenticated, fetchUsers]);

  return { users, setUsers, isLoadingUsers, error, fetchUsers };
}
