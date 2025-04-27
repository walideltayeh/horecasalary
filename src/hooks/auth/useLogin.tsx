
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
        toast.success(`Welcome, ${data.user.email}!`);
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

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("useLogin: Logging out");
      
      // First clear any session data
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        toast.error('Failed to log out');
        return;
      }
      
      toast.info('Logged out successfully');
      
      // Force a page reload to clear any cached state
      window.location.href = '/login';
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
