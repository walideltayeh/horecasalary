
import { useState, useCallback, useEffect, useRef } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { validateRole } from '@/utils/authUtils';
import { fetchWithRetry } from '@/utils/networkUtils';

export function useUsers(isAdmin: boolean, authenticated: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [fetchCount, setFetchCount] = useState<number>(0);
  const requestInProgressRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch users from Supabase Auth system
  const fetchUsers = useCallback(async (force: boolean = false) => {
    // Don't fetch if not admin or not authenticated
    if (!isAdmin || !authenticated) {
      console.log("[useUsers] Not fetching users - not admin or not authenticated", {isAdmin, authenticated});
      return;
    }
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      console.log("[useUsers] Cancelling previous fetch request");
      abortControllerRef.current.abort();
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
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      // Call admin function to list users with explicit timeout and retry
      const fetchResult = await fetchWithRetry(async () => {
        // Add timeoutPromise to ensure request doesn't hang
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000);
        });
        
        const fetchPromise = supabase.functions.invoke('admin', {
          method: 'POST',
          body: { action: 'listUsers' },
          signal  // Add abort signal
        });
        
        return Promise.race([fetchPromise, timeoutPromise]) as any;
      }, 3, 1000);
      
      // Handle errors
      if (fetchResult.error) {
        console.error("[useUsers] Error fetching users:", fetchResult.error);
        setError(typeof fetchResult.error === 'string' ? fetchResult.error : fetchResult.error.message || 'Failed to fetch users');
        return;
      }
      
      if (fetchResult?.data?.error) {
        console.error("[useUsers] Error from admin function:", fetchResult.data.error);
        setError(typeof fetchResult.data.error === 'string' ? fetchResult.data.error : 'Failed to fetch users');
        return;
      }
      
      // Parse and format user data
      if (fetchResult?.data?.data?.users) {
        const usersList = fetchResult.data.data.users;
        
        if (Array.isArray(usersList)) {
          const mappedUsers = usersList.map(authUser => {
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
          console.error("[useUsers] Users data is not an array:", usersList);
          setError("Invalid users data format");
        }
      } else {
        console.error("[useUsers] No users data in response:", fetchResult);
        setError("Could not retrieve user data");
      }
    } catch (err: any) {
      // Don't set error for aborted requests
      if (err.name === 'AbortError') {
        console.log("[useUsers] Request was cancelled");
        return;
      }
      
      console.error("[useUsers] Error fetching users:", err);
      setError(typeof err === 'string' ? err : err.message || 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
      requestInProgressRef.current = false;
      abortControllerRef.current = null;
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
        // Cancel any in-flight request when unmounting
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [isAdmin, authenticated, fetchUsers]);

  return { users, setUsers, isLoadingUsers, error, fetchUsers };
}
