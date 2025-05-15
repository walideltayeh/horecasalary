
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isNetworkError, isOnline } from '@/utils/networkUtils';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Attempts to log in a user with the provided email and password
   * Includes retry logic for transient network issues
   */
  const login = async (email: string, password: string, maxRetries = 2): Promise<boolean> => {
    if (!isOnline()) {
      toast.error('You appear to be offline. Please check your internet connection.');
      return false;
    }
    
    try {
      setIsLoading(true);
      console.log("useLogin: Attempting login with:", email);
      
      const loginEmail = email.includes('@') ? email : `${email}@horeca.app`;
      
      // Initial login attempt
      let result = await attemptLogin(loginEmail, password);
      
      // If first attempt fails with network error, retry with backoff
      if (!result.success && result.shouldRetry && maxRetries > 0) {
        console.log(`Login failed with network error, will retry ${maxRetries} more times`);
        
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - maxRetries)));
        return login(email, password, maxRetries - 1);
      }
      
      return result.success;
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper function to attempt a single login
   */
  const attemptLogin = async (email: string, password: string): Promise<{ 
    success: boolean;
    shouldRetry: boolean;
  }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (error) {
        console.error("useLogin: Login error:", error);
        
        // Check if it's a network-related error that should be retried
        if (isNetworkError(error)) {
          return { success: false, shouldRetry: true };
        }
        
        toast.error('Invalid credentials');
        return { success: false, shouldRetry: false };
      }
      
      if (data.user) {
        console.log("useLogin: Login successful for user:", data.user.id);
        return { success: true, shouldRetry: false };
      }
      
      return { success: false, shouldRetry: false };
    } catch (err: any) {
      console.error("Login attempt error:", err);
      const isNetwork = isNetworkError(err);
      
      if (isNetwork) {
        toast.error('Network connectivity issue. Retrying...');
      }
      
      return { 
        success: false, 
        shouldRetry: isNetwork
      };
    }
  };

  /**
   * Logs out the current user with improved error handling
   */
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
      
      // Simple retry logic for logout
      let logoutSuccess = false;
      let attempts = 0;
      
      while (!logoutSuccess && attempts < 3) {
        try {
          // Then call the official signOut method
          const { error } = await supabase.auth.signOut({
            scope: 'local' // Only clear local session, not on server
          });
          
          if (error) {
            // If we get an error but it's about missing session, we can ignore it
            if (error.message?.includes('Auth session missing')) {
              console.log("useLogin: Auth session was already missing, continuing logout");
              logoutSuccess = true;
            } else {
              console.error("useLogin: Logout error on attempt", attempts + 1, ":", error);
              attempts++;
              
              if (attempts >= 3) {
                toast.error('Failed to log out properly. Please try again.');
              }
              
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          } else {
            logoutSuccess = true;
          }
        } catch (err) {
          console.error('Logout attempt error:', err);
          attempts++;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
      
      console.log("useLogin: Logout complete, redirecting to login page");
      
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
