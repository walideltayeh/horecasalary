
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Separate hook for managing auth state
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch users from the users table
  const fetchUsers = async () => {
    try {
      console.log("Fetching all users");
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      if (data) {
        const mappedUsers: User[] = data.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role as 'admin' | 'user',
          password: u.password
        }));
        
        setUsers(mappedUsers);
        localStorage.setItem('horeca-users', JSON.stringify(mappedUsers));
      }
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
    }
  };

  // Set up auth listeners
  useEffect(() => {
    console.log("useAuthState: Setting up auth state listener");
    setIsLoading(true);
    
    // First, set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("useAuthState: Auth state changed:", event, session?.user?.id);
        
        if (session && session.user) {
          // Fetch user details from the users table
          console.log("useAuthState: Fetching user details for:", session.user.id);
          
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching user details:', error);
            setUser(null);
            setIsLoading(false);
            return;
          }
          
          if (data) {
            const currentUser: User = {
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role as 'admin' | 'user',
              password: data.password
            };
            
            console.log("useAuthState: Setting user state:", currentUser);
            setUser(currentUser);
          } else {
            console.log("useAuthState: No user data found");
            setUser(null);
          }
        } else {
          console.log("useAuthState: No session, clearing user state");
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // Check for existing session on mount
    const checkExistingSession = async () => {
      console.log("useAuthState: Checking for existing session");
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setIsLoading(false);
        return;
      }
      
      console.log("useAuthState: Existing session check result:", !!session);
      
      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // No need to fetch user details here as the onAuthStateChange
      // listener will handle it when it fires for the existing session
    };
    
    checkExistingSession();
    fetchUsers();

    return () => {
      console.log("useAuthState: Cleaning up auth state subscription");
      subscription.unsubscribe();
    };
  }, []);
  
  return { user, users, setUsers, isLoading, fetchUsers };
}
