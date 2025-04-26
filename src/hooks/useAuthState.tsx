
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
  
  // Fetch all users from Supabase
  const fetchUsers = async () => {
    try {
      console.log("Fetching users from session metadata instead of users table");
      
      // For demonstration purposes, we'll use hardcoded users
      // In a real app, this would query a profiles table instead of users table
      // to avoid the infinite recursion error with RLS policies
      const adminUser: User = {
        id: '6ed9791e-b2b3-4440-a434-673a9f2d06c4', // Known admin ID from auth.users
        email: 'admin@horeca.app',
        name: 'Admin',
        role: 'admin',
        password: null // We never store passwords client-side in real apps
      };
      
      // Here we'd normally fetch additional users from a profiles table
      // that doesn't have the RLS recursion issue
      setUsers([adminUser]);
      
      console.log("Set up users from session data");
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users. Please try refreshing the page.");
    }
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
          let role = 'user';
          let name = metadata.name || 'User';
          
          // If this is our known admin user, make sure to set the role correctly
          if (email === 'admin@horeca.app' || email === 'admin') {
            role = 'admin';
            name = 'Admin';
          }
          
          const currentUser: User = {
            id: newSession.user.id,
            email: email,
            name: name,
            role: role,
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
          let role = 'user';
          let name = metadata.name || 'User';
          
          // If this is our known admin user, make sure to set the role correctly
          if (email === 'admin@horeca.app' || email === 'admin') {
            role = 'admin';
            name = 'Admin';
          }
          
          const currentUser: User = {
            id: session.user.id,
            email: email,
            name: name,
            role: role,
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
