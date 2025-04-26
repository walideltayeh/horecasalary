
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Separate hook for managing auth state
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);
  
  // Fetch all users from Supabase Auth users
  const fetchUsers = async () => {
    try {
      console.log("Fetching users from Supabase Auth system");
      
      // We can't directly query auth.users using the JS client due to RLS limitations
      // Instead, we'll use the admin session to fetch the list of users
      const { data: authUsersList, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching auth users:", authError);
        toast.error("Failed to load users. Please try again.");
        return;
      }
      
      if (!authUsersList || !authUsersList.users) {
        console.log("No auth users found");
        setUsers([]);
        return;
      }
      
      // Map the auth users to our User type
      const mappedUsers = authUsersList.users.map(authUser => {
        const metadata = authUser.user_metadata || {};
        const email = authUser.email || '';
        
        // For demo purposes, check if this is our known admin user
        let roleName = 'user';
        let name = metadata.name || 'User';
        
        if (email === 'admin@horeca.app' || email === 'admin') {
          roleName = 'admin';
          name = 'Admin';
        }
        
        return {
          id: authUser.id,
          email: email,
          name: name,
          role: validateRole(roleName),
          password: null // We never store passwords client-side in real apps
        };
      });
      
      console.log("Fetched users:", mappedUsers);
      setUsers(mappedUsers);
      
    } catch (err: any) {
      console.error("Error fetching users:", err);
      
      // Fallback to hardcoded admin for demo purposes when facing permission issues
      const adminUser: User = {
        id: '6ed9791e-b2b3-4440-a434-673a9f2d06c4', // Known admin ID
        email: 'admin@horeca.app',
        name: 'Admin',
        role: 'admin',
        password: null
      };
      
      console.log("Setting up fallback users");
      setUsers([adminUser]);
      
      toast.error("Failed to load all users. Using fallback data.");
    }
  };

  // Helper function to ensure valid role type
  const validateRole = (roleValue: string): 'admin' | 'user' => {
    if (roleValue === 'admin') return 'admin';
    return 'user'; // Default to 'user' for any other value
  };

  // Set up auth listeners
  useEffect(() => {
    console.log("useAuthState: Setting up auth state listener");
    setIsLoading(true);
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
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
          
          // Extract user info directly from the session metadata
          // This avoids querying the users table which has the RLS infinite recursion issue
          const metadata = newSession.user.user_metadata || {};
          const email = newSession.user.email || '';
          
          // For demo purposes, recognize the admin user
          let roleName = 'user';
          let name = metadata.name || 'User';
          
          // If this is our known admin user, make sure to set the role correctly
          if (email === 'admin@horeca.app' || email === 'admin') {
            roleName = 'admin';
            name = 'Admin';
          }
          
          const currentUser: User = {
            id: newSession.user.id,
            email: email,
            name: name,
            role: validateRole(roleName), // Ensure role is a valid type
            password: null // We never store passwords client-side in real apps
          };
          
          console.log("useAuthState: Setting user from session data:", currentUser);
          setUser(currentUser);
          
          // Fetch users data after successful authentication
          // Delay to avoid any potential recursion issues
          setTimeout(() => {
            fetchUsers();
          }, 0);
          
          setIsLoading(false);
        } else {
          console.log("useAuthState: No session in state change");
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    );
    
    // Then check for existing session
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
        
        // If session exists, extract user info from user object
        if (session && session.user) {
          const metadata = session.user.user_metadata || {};
          const email = session.user.email || '';
          
          // For demo purposes, recognize the admin user
          let roleName = 'user';
          let name = metadata.name || 'User';
          
          // If this is our known admin user, make sure to set the role correctly
          if (email === 'admin@horeca.app' || email === 'admin') {
            roleName = 'admin';
            name = 'Admin';
          }
          
          const currentUser: User = {
            id: session.user.id,
            email: email,
            name: name,
            role: validateRole(roleName), // Ensure role is a valid type
            password: null // We never store passwords client-side in real apps
          };
          
          console.log("useAuthState: Setting user from session:", currentUser);
          setUser(currentUser);
          
          // Fetch users after a slight delay
          setTimeout(() => {
            fetchUsers();
          }, 0);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error in auth setup:", err);
        setIsLoading(false);
      }
    };
    
    checkExistingSession();

    return () => {
      console.log("useAuthState: Cleaning up auth state subscription");
      subscription.unsubscribe();
    };
  }, []);
  
  return { user, users, setUsers, isLoading, session, fetchUsers };
}
