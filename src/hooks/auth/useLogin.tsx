
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("useLogin: Attempting login with:", email);
      
      const loginEmail = email.includes('@') ? email : `${email}@horeca.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });
      
      if (error) {
        console.error("useLogin: Login error:", error);
        toast.error('Invalid credentials');
        return false;
      }
      
      if (data.user) {
        console.log("useLogin: Login successful for user:", data.user.id);
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log("useLogin: Starting logout process");
      
      // First manually clear session from local storage to handle potential Auth Session Missing errors
      try {
        localStorage.removeItem('supabase-horeca-app-auth');
        console.log("useLogin: Cleared local storage auth data");
      } catch (storageErr) {
        console.warn("useLogin: Failed to clear local storage:", storageErr);
      }
      
      // Then call the official signOut method
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Only clear local session, not on server
      });
      
      if (error) {
        // If we get an error but it's about missing session, we can ignore it
        if (error.message?.includes('Auth session missing')) {
          console.log("useLogin: Auth session was already missing, continuing logout");
        } else {
          console.error("useLogin: Logout error:", error);
          toast.error('Failed to log out');
          return;
        }
      }
      
      console.log("useLogin: Logout successful, redirecting to login page");
      
      // Allow time for state changes to propagate
      setTimeout(() => {
        // Force a page reload to clear any cached state and redirect
        window.location.replace('/login');
      }, 100);
      
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    logout,
    isLoading
  };
}
