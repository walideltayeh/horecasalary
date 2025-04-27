
import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  
  const validateRole = (roleValue: string): 'admin' | 'user' => {
    if (roleValue === 'admin') return 'admin';
    return 'user'; // Default to 'user' for any other value
  };

  const fetchUsers = useCallback(async () => {
    try {
      console.log("Fetching users from Supabase Auth system");
      setIsLoadingUsers(true);
      setError(null);
      
      // Call the admin function to list users with more specific params
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
    if (user?.role === 'admin') {
      const intervalId = setInterval(() => {
        console.log("Polling for user updates");
        fetchUsers();
      }, 60000); // Poll every minute
      
      return () => clearInterval(intervalId);
    }
  }, [user, fetchUsers]);

  // Set up realtime subscription for auth changes
  useEffect(() => {
    console.log("useAuthState: Setting up auth state listener");
    setIsLoading(true);
    
    // First set up the auth state listener before checking for existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("useAuthState: Auth state changed:", event, newSession?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          console.log("useAuthState: User signed out, clearing user state");
          setUser(null);
          setSession(null);
          setUsers([]);
          setIsLoading(false);
          return;
        }
        
        if (newSession && newSession.user) {
          setSession(newSession);
          
          const metadata = newSession.user.user_metadata || {};
          const email = newSession.user.email || '';
          
          let roleName = metadata.role || 'user';
          let name = metadata.name || email.split('@')[0] || 'User';
          
          if (email === 'admin@horeca.app' || email === 'admin') {
            roleName = 'admin';
            name = 'Admin';
          }
          
          const currentUser: User = {
            id: newSession.user.id,
            email: email,
            name: name,
            role: validateRole(roleName),
            password: null
          };
          
          console.log("useAuthState: Setting user from session data:", currentUser);
          setUser(currentUser);
          
          // If admin, fetch all users immediately
          if (currentUser.role === 'admin') {
            console.log("Admin user detected, fetching all users");
            await fetchUsers();
          }
          
          setIsLoading(false);
        } else {
          console.log("useAuthState: No session in state change");
          setUser(null);
          setSession(null);
          setUsers([]);
          setIsLoading(false);
        }
      }
    );
    
    const checkExistingSession = async () => {
      try {
        console.log("useAuthState: Checking for existing session");
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          setIsLoading(false);
          return;
        }
        
        console.log("useAuthState: Existing session check result:", !!session);
        setSession(session);
        
        if (!session) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (session && session.user) {
          const metadata = session.user.user_metadata || {};
          const email = session.user.email || '';
          
          let roleName = metadata.role || 'user';
          let name = metadata.name || email.split('@')[0] || 'User';
          
          if (email === 'admin@horeca.app' || email === 'admin') {
            roleName = 'admin';
            name = 'Admin';
          }
          
          const currentUser: User = {
            id: session.user.id,
            email: email,
            name: name,
            role: validateRole(roleName),
            password: null
          };
          
          console.log("useAuthState: Setting user from session:", currentUser);
          setUser(currentUser);
          
          // If admin, fetch all users immediately
          if (roleName === 'admin') {
            console.log("Admin user detected, fetching all users");
            await fetchUsers();
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error in auth setup:", err);
        setIsLoading(false);
      }
    };
    
    // Setup local storage listener for cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'users_updated' && user?.role === 'admin') {
        console.log("User data updated in another tab, refreshing");
        fetchUsers();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check for existing session after setting up the listener
    checkExistingSession();

    return () => {
      console.log("useAuthState: Cleaning up auth state subscription");
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchUsers]);

  return { 
    user, 
    users, 
    setUsers, 
    isLoading, 
    isLoadingUsers, 
    error,
    session, 
    fetchUsers 
  };
}
