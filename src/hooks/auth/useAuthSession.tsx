
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { validateRole, formatDisplayName } from '@/utils/authUtils';

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    console.log("useAuthSession: Setting up auth state listener");
    
    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("useAuthSession: Auth state changed:", event);
        
        if (event === 'SIGNED_OUT') {
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
          let name = formatDisplayName(email, metadata.name);
          
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
          
          setUser(currentUser);
          setIsLoading(false);
        } else {
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session once
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          setIsLoading(false);
          return;
        }
        
        if (!session) {
          setUser(null);
          setSession(null);
          setIsLoading(false);
          return;
        }
        
        // Process session the same way as in the listener
        const metadata = session.user.user_metadata || {};
        const email = session.user.email || '';
        
        let roleName = metadata.role || 'user';
        let name = formatDisplayName(email, metadata.name);
        
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
        
        setUser(currentUser);
        setSession(session);
        setIsLoading(false);
      } catch (err) {
        console.error("Error in session check:", err);
        setIsLoading(false);
      }
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, session };
}
