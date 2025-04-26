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
      
      const { data, error } = await supabase.functions.invoke('admin', {
        body: {
          action: 'createUser',
          userData: {
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: { 
              name: userData.name,
              role: userData.role
            }
          }
        }
      });

      if (error) {
        console.error('Error adding user:', error);
        toast.error(error.message || 'Failed to add user');
        return false;
      }

      console.log("User added successfully:", data);
      toast.success(`User ${userData.name} added successfully`);
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Failed to add user');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'user' }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Updating user:", userId, userData);

      const { data, error } = await supabase.functions.invoke('admin', {
        body: {
          action: 'updateUser',
          userData: {
            id: userId,
            ...userData,
            user_metadata: {
              name: userData.name,
              role: userData.role
            }
          }
        }
      });

      if (error) {
        console.error('Error updating user:', error);
        toast.error(error.message || 'Failed to update user');
        return false;
      }

      console.log("User updated successfully:", data);
      toast.success('User updated successfully');
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
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
        body: {
          action: 'deleteUser',
          userData: { id: userId }
        }
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast.error(error.message || 'Failed to delete user');
        return false;
      }

      console.log("User deleted successfully");
      toast.success('User deleted successfully');
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
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
