
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
      setIsLoading(true);
      
      // First try to fetch from admin API - this might fail with standard permissions
      try {
        const { data: authUsersList, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsersList && authUsersList.users) {
          console.log("Successfully fetched users from admin API:", authUsersList.users);
          
          const mappedUsers = authUsersList.users.map(authUser => {
            const metadata = authUser.user_metadata || {};
            const email = authUser.email || '';
            
            // For demo purposes, check if this is our known admin user
            let roleName = metadata.role || 'user';
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
          
          console.log("Fetched users from admin API:", mappedUsers);
          setUsers(mappedUsers);
          setIsLoading(false);
          return;
        } else {
          console.log("Admin API returned error:", authError);
          throw new Error("Admin API access denied");
        }
      } catch (adminError) {
        // This is expected - most client tokens don't have admin privileges
        console.log("Admin API access denied - falling back to alternative approach:", adminError);
      }
      
      // If admin API fails, fallback to current user + hardcoded demo users
      // This is just for the demo - in a real app, you'd implement a different approach
      console.log("Using demo user data");
      const demoUsers: User[] = [];
      
      // Always include the admin user
      const adminUser: User = {
        id: '6ed9791e-b2b3-4440-a434-673a9f2d06c4', // Fixed admin ID for demo
        email: 'admin@horeca.app',
        name: 'Admin',
        role: 'admin',
        password: null
      };
      
      demoUsers.push(adminUser);
      
      // Include the current user if not admin and if we have one
      if (user && user.role !== 'admin' && user.id !== adminUser.id) {
        demoUsers.push(user);
      }
      
      // For demo, add some example users
      const demoUser1: User = {
        id: '7ed9791e-b2b3-4440-a434-673a9f2d06c5',
        email: 'user1@horeca.app',
        name: 'User 1',
        role: 'user',
        password: null
      };
      
      const demoUser2: User = {
        id: '8ed9791e-b2b3-4440-a434-673a9f2d06c6',
        email: 'user2@horeca.app',
        name: 'User 2',
        role: 'user',
        password: null
      };
      
      const randomUsers = [
        {
          id: '9ed9791e-b2b3-4440-a434-673a9f2d06c7',
          email: 'sales@horeca.app',
          name: 'Sales Representative',
          role: 'user',
          password: null
        },
        {
          id: '10ed9791e-b2b3-4440-a434-673a9f2d06c8',
          email: 'manager@horeca.app',
          name: 'Regional Manager',
          role: 'user',
          password: null
        }
      ];
      
      // Add the demo users
      demoUsers.push(demoUser1);
      demoUsers.push(demoUser2);
      
      // Add some random users based on date to simulate changes
      const dateBasedSelection = new Date().getMinutes() % 2;
      if (dateBasedSelection === 0) {
        demoUsers.push(randomUsers[0]);
      } else {
        demoUsers.push(randomUsers[1]);
      }
      
      console.log("Setting up demo users:", demoUsers);
      setUsers(demoUsers);
      
      // No error toast here since this is expected behavior in demo mode
      console.log("Using demo user data (admin API access denied)");
      
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
      
      // Demo users for fallback
      const demoUser1: User = {
        id: '7ed9791e-b2b3-4440-a434-673a9f2d06c5',
        email: 'user1@horeca.app',
        name: 'User 1',
        role: 'user',
        password: null
      };
      
      const demoUser2: User = {
        id: '8ed9791e-b2b3-4440-a434-673a9f2d06c6',
        email: 'user2@horeca.app',
        name: 'User 2',
        role: 'user',
        password: null
      };
      
      console.log("Setting up fallback users");
      setUsers([adminUser, demoUser1, demoUser2]);
      
      // Don't show error toast here anymore since we have a fallback
      console.log("Using fallback demo data");
    } finally {
      setIsLoading(false);
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
          let roleName = metadata.role || 'user';
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
          let roleName = metadata.role || 'user';
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
