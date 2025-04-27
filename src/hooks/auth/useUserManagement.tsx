
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUserManagement() {
  const [isLoading, setIsLoading] = useState(false);

  const addUser = async (userData: { 
    name: string; 
    email: string; 
    password: string; 
    role: 'admin' | 'user' 
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Adding new user:", userData.email);
      
      const email = userData.email.includes('@') ? userData.email : `${userData.email}@horeca.app`;
      
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

      if (error || data?.error) {
        const errorMessage = error?.message || data?.error || 'Failed to add user';
        console.error('Error adding user:', errorMessage);
        toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to add user');
        return false;
      }

      console.log("User added successfully:", data);
      toast.success(`User ${userData.name} added successfully`);
      return true;
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to add user');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: { 
    name?: string; 
    email?: string; 
    password?: string; 
    role?: 'admin' | 'user' 
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Updating user:", userId, userData);

      const updatePayload: any = { id: userId };
      
      if (userData.email) updatePayload.email = userData.email;
      if (userData.password) updatePayload.password = userData.password;
      
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

      if (error || data?.error) {
        const errorMessage = error?.message || data?.error || 'Failed to update user';
        console.error('Error updating user:', errorMessage);
        toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to update user');
        return false;
      }

      console.log("User updated successfully:", data);
      toast.success('User updated successfully');
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

      if (error || data?.error) {
        const errorMessage = error?.message || data?.error || 'Failed to delete user';
        console.error('Error deleting user:', errorMessage);
        toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to delete user');
        return false;
      }

      console.log("User deleted successfully");
      toast.success('User deleted successfully');
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
    addUser,
    updateUser,
    deleteUser,
    isLoading
  };
}
