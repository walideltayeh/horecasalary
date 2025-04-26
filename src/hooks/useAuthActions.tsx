
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthState } from './useAuthState';

// Separate hook for auth actions
export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUsers } = useAuthState();

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("useAuthActions: Attempting login with:", email);
      
      // Handle email with or without @horeca.app
      const loginEmail = email.includes('@') ? email : `${email}@horeca.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });
      
      if (error) {
        console.error("useAuthActions: Login error:", error);
        toast.error('Invalid credentials');
        setIsLoading(false);
        return false;
      }
      
      if (data.user) {
        console.log("useAuthActions: Login successful for user:", data.user.id);
        toast.success(`Welcome, ${data.user.email}!`);
        // The fetchUsers call will happen automatically via the onAuthStateChange listener
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred');
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("useAuthActions: Logging out");
      await supabase.auth.signOut();
      toast.info('Logged out successfully');
      
      // Force navigation to login page after logout in case the listener doesn't catch it
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes, we'll have simplified versions of these functions
  // that work with our hardcoded users approach

  // Add user function (simplified for demo)
  const addUser = async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
    try {
      setIsLoading(true);
      toast.info("In demo mode - Can't add real users due to database constraints");
      // In a real app, we would add the user to the database here using Supabase Auth API
      
      // For a full implementation, we would use:
      // const { data, error } = await supabase.auth.admin.createUser({
      //   email: userData.email,
      //   password: userData.password,
      //   user_metadata: { name: userData.name, role: userData.role }
      // });
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(`Failed to add user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user function (simplified for demo)
  const updateUser = async (userId: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'user' }): Promise<boolean> => {
    try {
      setIsLoading(true);
      toast.info("In demo mode - Can't update real users due to database constraints");
      // In a real app, we would update the user in the database here using Supabase Admin API
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user function (simplified for demo)
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      toast.info("In demo mode - Can't delete real users due to database constraints");
      // In a real app, we would delete the user from the database here using Supabase Admin API
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    isLoading
  };
}
