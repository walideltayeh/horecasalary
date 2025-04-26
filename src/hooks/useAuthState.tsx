
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Separate hook for managing auth state
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);
  
  // Since we can't fetch users from the table due to RLS infinite recursion,
  // we'll use a hardcoded admin user for demo purposes
  const setupHardcodedUsers = () => {
    const adminUser: User = {
      id: '6ed9791e-b2b3-4440-a434-673a9f2d06c4', // This is the known admin user ID
      email: 'admin@horeca.app',
      name: 'Admin',
      role: 'admin',
      password: 'AlFakher2025' // In a real app, we wouldn't store passwords client-side
    };
    
    setUsers([adminUser]);
    localStorage.setItem('horeca-users', JSON.stringify([adminUser]));
    console.log('Set up hardcoded admin user for demo purposes');
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
          const metadata = newSession.user.user_metadata;
          
          if (metadata) {
            const currentUser: User = {
              id: newSession.user.id,
              email: metadata.email || newSession.user.email,
              name: metadata.name || 'User',
              role: metadata.role || 'user',
              password: null // We never store passwords client-side in real apps
            };
            
            console.log("useAuthState: Setting user from session metadata:", currentUser);
            setUser(currentUser);
          } else {
            console.log("useAuthState: No user metadata in session");
            setUser(null);
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
        
        // If session exists, extract user info from metadata
        if (session && session.user) {
          const metadata = session.user.user_metadata;
          
          if (metadata) {
            const currentUser: User = {
              id: session.user.id,
              email: metadata.email || session.user.email,
              name: metadata.name || 'User',
              role: metadata.role || 'user',
              password: null // We never store passwords client-side in real apps
            };
            
            console.log("useAuthState: Setting user from session metadata:", currentUser);
            setUser(currentUser);
          } else {
            console.log("useAuthState: No metadata in user session");
            setUser(null);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error in auth setup:", err);
        setIsLoading(false);
      }
    };
    
    checkExistingSession();
    setupHardcodedUsers(); // Use hardcoded users instead of fetching from database

    return () => {
      console.log("useAuthState: Cleaning up auth state subscription");
      subscription.unsubscribe();
    };
  }, []);
  
  return { user, users, setUsers, isLoading, session, fetchUsers: setupHardcodedUsers };
}
