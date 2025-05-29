
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateEmail, sanitizeInput, createRateLimiter } from '@/utils/inputValidation';

// Rate limiter: 5 attempts per 15 minutes
const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000);

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Input validation and sanitization
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      
      if (!validateEmail(sanitizedEmail)) {
        toast.error('Please enter a valid email address');
        return false;
      }
      
      if (!password || password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return false;
      }
      
      if (password.length > 128) {
        toast.error('Password is too long');
        return false;
      }
      
      // Rate limiting
      const clientIP = 'user-session'; // In production, use actual IP
      if (!loginRateLimiter(clientIP)) {
        toast.error('Too many login attempts. Please try again later.');
        return false;
      }
      
      console.log("useLogin: Attempting secure login for:", sanitizedEmail);
      
      const loginEmail = sanitizedEmail.includes('@') ? sanitizedEmail : `${sanitizedEmail}@horeca.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });
      
      if (error) {
        console.error("useLogin: Login error:", error);
        
        // Don't expose detailed error messages to prevent user enumeration
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (error.message.includes('rate limit')) {
          toast.error('Too many attempts. Please try again later.');
        } else {
          toast.error('Login failed. Please try again.');
        }
        return false;
      }
      
      if (data.user) {
        console.log("useLogin: Login successful for user:", data.user.id);
        toast.success('Login successful');
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
      console.log("useLogin: Starting secure logout process");
      
      // Clear sensitive data from localStorage
      try {
        localStorage.removeItem('supabase-horeca-app-auth');
        sessionStorage.clear(); // Clear any session data
        console.log("useLogin: Cleared local storage auth data");
      } catch (storageErr) {
        console.warn("useLogin: Failed to clear local storage:", storageErr);
      }
      
      const { error } = await supabase.auth.signOut({
        scope: 'local'
      });
      
      if (error) {
        if (error.message?.includes('Auth session missing')) {
          console.log("useLogin: Auth session was already missing, continuing logout");
        } else {
          console.error("useLogin: Logout error:", error);
          toast.error('Failed to log out completely');
          return;
        }
      }
      
      console.log("useLogin: Logout successful, redirecting to login page");
      
      // Force a clean redirect
      setTimeout(() => {
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
