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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.includes('@') ? email : `${email}@horeca.app`,
        password: password,
      });
      
      if (error) {
        console.error("useAuthActions: Login error:", error);
        toast.error('Invalid credentials');
        return false;
      }
      
      if (data.user) {
        console.log("useAuthActions: Login successful for user:", data.user.id);
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

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("useAuthActions: Logging out");
      await supabase.auth.signOut();
      toast.info('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out');
    } finally {
      setIsLoading(false);
      // Force navigation to login page after logout
      window.location.href = '/login';
    }
  };

  // Add user function
  const addUser = async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
    try {
      setIsLoading(true);
      // Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });
      
      if (authError) throw authError;
      
      // Insert user details into the users table
      const { error: userTableError } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: userData.password
        });
      
      if (userTableError) throw userTableError;
      
      // Refresh users list
      await fetchUsers();
      
      toast.success(`User ${userData.name} added successfully`);
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(`Failed to add user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user function
  const updateUser = async (userId: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'user' }): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Update user in the users table
      const updateData: { name?: string; email?: string; role?: string } = {};
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.role) updateData.role = userData.role;

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // If password is provided, update it in Supabase Auth
      if (userData.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: userData.password }
        );
        
        if (passwordError) throw passwordError;
      }
      
      // Refresh users list
      await fetchUsers();
      
      toast.success('User updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user function
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Delete user from the users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (deleteError) throw deleteError;
      
      // Delete user from Supabase Auth
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authDeleteError) throw authDeleteError;
      
      // Refresh users list
      await fetchUsers();
      
      toast.success('User deleted successfully');
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
