
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);
  
  const validateRole = (roleValue: string): 'admin' | 'user' => {
    if (roleValue === 'admin') return 'admin';
    return 'user'; // Default to 'user' for any other value
  };

  const fetchUsers = async () => {
    try {
      console.log("Fetching users from Supabase Auth system");
      setIsLoading(true);
      
      // Call the admin function to list users with more specific params
      const { data, error } = await supabase.functions.invoke('admin', {
        method: 'POST',
        body: { action: 'listUsers' }
      });
      
      console.log("Fetch users response:", data, error);
      
      if (error) {
        console.error("Error fetching users:", error);
        toast.error(typeof error === 'string' ? error : error.message || 'Failed to fetch users');
        return;
      }
      
      if (data?.error) {
        console.error("Error from admin function:", data.error);
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to fetch users');
        return;
      }
      
      if (data?.data?.users) {
        const mappedUsers = data.data.users.map(authUser => {
          const metadata = authUser.user_metadata || {};
          return {
            id: authUser.id,
            email: authUser.email || '',
            name: metadata.name || 'User',
            role: validateRole(metadata.role || 'user'),
            password: null
          };
        });
        
        console.log("Fetched users:", mappedUsers.length, "users");
        setUsers(mappedUsers);
      } else {
        console.error("No users data in response:", data);
        toast.error("Could not retrieve user data");
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast.error(typeof err === 'string' ? err : err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

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
          setIsLoading(false);
          return;
        }
        
        if (newSession && newSession.user) {
          setSession(newSession);
          
          const metadata = newSession.user.user_metadata || {};
          const email = newSession.user.email || '';
          
          let roleName = metadata.role || 'user';
          let name = metadata.name || 'User';
          
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
          if (roleName === 'admin') {
            console.log("Admin user detected, fetching all users");
            await fetchUsers();
          }
          
          setIsLoading(false);
        } else {
          console.log("useAuthState: No session in state change");
          setUser(null);
          setSession(null);
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
          let name = metadata.name || 'User';
          
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
    
    // Check for existing session after setting up the listener
    checkExistingSession();

    return () => {
      console.log("useAuthState: Cleaning up auth state subscription");
      subscription.unsubscribe();
    };
  }, []);

  return { user, users, setUsers, isLoading, session, fetchUsers };
}
