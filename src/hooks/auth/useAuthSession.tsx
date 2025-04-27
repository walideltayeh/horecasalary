
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { validateRole } from '@/utils/auth';

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    console.log("useAuthSession: Setting up auth state listener");
    setIsLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("useAuthSession: Auth state changed:", event, newSession?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          console.log("useAuthSession: User signed out, clearing user state");
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
          
          console.log("useAuthSession: Setting user from session data:", currentUser);
          setUser(currentUser);
          setIsLoading(false);
        } else {
          console.log("useAuthSession: No session in state change");
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    );

    const checkExistingSession = async () => {
      try {
        console.log("useAuthSession: Checking for existing session");
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          setIsLoading(false);
          return;
        }
        
        console.log("useAuthSession: Existing session check result:", !!session);
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
          
          console.log("useAuthSession: Setting user from session:", currentUser);
          setUser(currentUser);
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
      console.log("useAuthSession: Cleaning up auth state subscription");
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, session };
}
