
import { useState, useCallback, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateRole } from '@/utils/auth';

export function useUsers(isAdmin: boolean, authenticated: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      console.log("Fetching users from Supabase Auth system");
      setIsLoadingUsers(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('admin', {
        method: 'POST',
        body: { action: 'listUsers' }
      });
      
      console.log("Fetch users response:", data, error);
      
      if (error) {
        console.error("Error fetching users:", error);
        setError(typeof error === 'string' ? error : error.message || 'Failed to fetch users');
        toast.error(typeof error === 'string' ? error : error.message || 'Failed to fetch users');
        return;
      }
      
      if (data?.error) {
        console.error("Error from admin function:", data.error);
        setError(typeof data.error === 'string' ? data.error : 'Failed to fetch users');
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to fetch users');
        return;
      }
      
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
        
        console.log("Fetched users:", mappedUsers.length, "users");
        console.log("User details:", mappedUsers);
        setUsers(mappedUsers);
      } else {
        console.error("No users data in response:", data);
        setError("Could not retrieve user data");
        toast.error("Could not retrieve user data");
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(typeof err === 'string' ? err : err.message || 'Failed to fetch users');
      toast.error(typeof err === 'string' ? err : err.message || 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Poll for users every minute if admin
  useEffect(() => {
    if (isAdmin && authenticated) {
      const intervalId = setInterval(() => {
        console.log("Polling for user updates");
        fetchUsers();
      }, 60000); // Poll every minute
      
      return () => clearInterval(intervalId);
    }
  }, [isAdmin, authenticated, fetchUsers]);

  return { users, setUsers, isLoadingUsers, error, fetchUsers };
}
