
import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useUsers(isAdmin: boolean, isAuthenticated: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchUserData = useCallback(async (force = false) => {
    // Skip if not admin or already fetched (unless forced)
    if (!isAdmin || !isAuthenticated || (fetchedRef.current && !force)) {
      return;
    }
    
    if (isLoading && !force) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (Array.isArray(data)) {
        const typedUsers = data.map(user => ({
          id: user.id,
          name: user.name as string,
          email: user.email as string,
          role: user.role as 'admin' | 'user',
          password: user.password as string | undefined
        }));
        
        typedUsers.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return a.name.localeCompare(b.name);
        });
        
        setUsers(typedUsers);
        fetchedRef.current = true;
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(error.message || "Failed to load users");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isAuthenticated, isLoading]);

  // Simple fetch on mount when conditions are met
  useEffect(() => {
    if (isAdmin && isAuthenticated && !fetchedRef.current) {
      fetchUserData();
    }
  }, [isAdmin, isAuthenticated, fetchUserData]);

  return { users, setUsers, isLoading, error, fetchUsers: fetchUserData };
}
