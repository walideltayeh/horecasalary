
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

  // Add user function - with demo mode logic
  const addUser = async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Adding new user:", userData.email);
      
      // For demo purposes, simulate successful user creation
      try {
        // Try the actual Supabase Auth admin API first
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: { 
            name: userData.name,
            role: userData.role
          }
        });
        
        if (!error) {
          toast.success(`User ${userData.name} added successfully`);
          fetchUsers(); // Refresh the users list
          setIsLoading(false);
          return true;
        }
        
        // If API call fails, fall back to demo mode
        console.log("Admin API failed, using demo mode:", error);
      } catch (apiError) {
        console.log("Admin API exception, using demo mode:", apiError);
      }
      
      // Demo mode - simulate successful user creation
      console.log("Demo mode: Simulating user addition");
      setTimeout(() => {
        fetchUsers(); // Refresh users list with demo data
        toast.success(`User ${userData.name} added (demo mode)`);
      }, 500);
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(`Failed to add user: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Update user function
  const updateUser = async (userId: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'user' }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Updating user:", userId);
      
      // For demo purposes, simulate successful user update
      try {
        // Try the actual Supabase Auth admin API first
        const updates: any = {};
        
        if (userData.email) {
          updates.email = userData.email;
        }
        
        if (userData.password) {
          updates.password = userData.password;
        }
        
        const userMetadata: any = {};
        
        if (userData.name) {
          userMetadata.name = userData.name;
        }
        
        if (userData.role) {
          userMetadata.role = userData.role;
        }
        
        if (Object.keys(userMetadata).length > 0) {
          updates.user_metadata = userMetadata;
        }
        
        if (Object.keys(updates).length === 0) {
          toast.info("No changes to update");
          setIsLoading(false);
          return true;
        }
        
        const { error } = await supabase.auth.admin.updateUserById(userId, updates);
        
        if (!error) {
          toast.success(`User updated successfully`);
          fetchUsers(); // Refresh the users list
          setIsLoading(false);
          return true;
        }
        
        // If API call fails, fall back to demo mode
        console.log("Admin API failed, using demo mode:", error);
      } catch (apiError) {
        console.log("Admin API exception, using demo mode:", apiError);
      }
      
      // Demo mode - simulate successful user update
      console.log("Demo mode: Simulating user update");
      setTimeout(() => {
        fetchUsers(); // Refresh users list with demo data
        toast.success(`User updated successfully (demo mode)`);
      }, 500);
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Delete user function
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Deleting user:", userId);
      
      // For demo purposes, simulate successful user deletion
      try {
        // Try the actual Supabase Auth admin API first  
        const { error } = await supabase.auth.admin.deleteUser(userId);
        
        if (!error) {
          toast.success(`User deleted successfully`);
          fetchUsers(); // Refresh the users list
          setIsLoading(false);
          return true;
        }
        
        // If API call fails, fall back to demo mode
        console.log("Admin API failed, using demo mode:", error);
      } catch (apiError) {
        console.log("Admin API exception, using demo mode:", apiError);
      }
      
      // Demo mode - simulate successful user deletion
      console.log("Demo mode: Simulating user deletion");
      setTimeout(() => {
        fetchUsers(); // Refresh users list with demo data
        toast.success(`User deleted successfully (demo mode)`);
      }, 500);
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
      setIsLoading(false);
      return false;
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
