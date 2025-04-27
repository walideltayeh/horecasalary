
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthState } from './useAuthState';

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUsers } = useAuthState();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("useAuthActions: Attempting login with:", email);
      
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

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("useAuthActions: Logging out");
      await supabase.auth.signOut();
      toast.info('Logged out successfully');
      
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

  const addUser = async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Adding new user:", userData.email);
      
      // Ensure the email is properly formatted
      const email = userData.email.includes('@') ? userData.email : `${userData.email}@horeca.app`;
      
      // Create user with clear metadata structure
      const { data, error } = await supabase.functions.invoke('admin', {
        method: 'POST',
        body: {
          action: 'createUser',
          userData: {
            email: email,
            password: userData.password,
            name: userData.name,
            role: userData.role
          }
        }
      });

      console.log("Add user response:", data, error);

      if (error) {
        console.error('Error adding user:', error);
        toast.error(typeof error === 'string' ? error : error.message || 'Failed to add user');
        return false;
      }

      if (data?.error) {
        console.error('Error from admin function:', data.error);
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to add user');
        return false;
      }

      console.log("User added successfully:", data);
      toast.success(`User ${userData.name} added successfully`);
      
      // Force refresh users list with multiple retry attempts
      let attempts = 0;
      const maxAttempts = 3;
      const retryDelay = 1500;
      
      const retryFetchUsers = async () => {
        attempts++;
        console.log(`Attempting to fetch users (attempt ${attempts})`);
        await fetchUsers();
        
        // If we still need more attempts
        if (attempts < maxAttempts) {
          setTimeout(retryFetchUsers, retryDelay);
        }
      };
      
      // Start retry sequence after initial delay
      setTimeout(retryFetchUsers, 1000);
      
      return true;
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to add user');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'user' }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Updating user:", userId, userData);

      // Prepare update data with proper structure for Supabase Auth
      const updatePayload: any = {
        id: userId
      };
      
      // Only add these fields if they exist
      if (userData.email) updatePayload.email = userData.email;
      if (userData.password) updatePayload.password = userData.password;
      
      // Add metadata if name or role is provided
      if (userData.name || userData.role) {
        updatePayload.user_metadata = {};
        if (userData.name) updatePayload.user_metadata.name = userData.name;
        if (userData.role) updatePayload.user_metadata.role = userData.role;
      }

      const { data, error } = await supabase.functions.invoke('admin', {
        method: 'POST',
        body: {
          action: 'updateUser',
          userData: updatePayload
        }
      });

      if (error) {
        console.error('Error updating user:', error);
        toast.error(typeof error === 'string' ? error : error.message || 'Failed to update user');
        return false;
      }

      if (data?.error) {
        console.error('Error from admin function:', data.error);
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to update user');
        return false;
      }

      console.log("User updated successfully:", data);
      toast.success('User updated successfully');
      
      // Multiple retry attempts for fetch users
      let attempts = 0;
      const maxAttempts = 3;
      const retryDelay = 1500;
      
      const retryFetchUsers = async () => {
        attempts++;
        console.log(`Attempting to fetch users after update (attempt ${attempts})`);
        await fetchUsers();
        
        if (attempts < maxAttempts) {
          setTimeout(retryFetchUsers, retryDelay);
        }
      };
      
      setTimeout(retryFetchUsers, 1000);
      
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to update user');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Deleting user:", userId);

      const { data, error } = await supabase.functions.invoke('admin', {
        method: 'POST',
        body: {
          action: 'deleteUser',
          userData: { id: userId }
        }
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast.error(typeof error === 'string' ? error : error.message || 'Failed to delete user');
        return false;
      }

      if (data?.error) {
        console.error('Error from admin function:', data.error);
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to delete user');
        return false;
      }

      console.log("User deleted successfully");
      toast.success('User deleted successfully');
      
      // Multiple retry attempts for fetch users
      let attempts = 0;
      const maxAttempts = 3;
      const retryDelay = 1500;
      
      const retryFetchUsers = async () => {
        attempts++;
        console.log(`Attempting to fetch users after delete (attempt ${attempts})`);
        await fetchUsers();
        
        if (attempts < maxAttempts) {
          setTimeout(retryFetchUsers, retryDelay);
        }
      };
      
      setTimeout(retryFetchUsers, 1000);
      
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to delete user');
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
