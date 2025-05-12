import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUserManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const operationInProgressRef = useRef<string | null>(null);

  // Helper function to notify updates across tabs
  const notifyUserDataChange = () => {
    try {
      localStorage.setItem('users_updated', String(Date.now()));
    } catch (e) {
      console.warn("Failed to update localStorage for cross-tab sync");
    }
  };

  // Add retry logic for reliability
  const retryOperation = async <T,>(
    operation: () => Promise<T>, 
    maxRetries = 2
  ): Promise<T> => {
    let lastError: any;
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.error(`Operation failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Calculate delay using exponential backoff
          const delay = 1000 * Math.pow(2, retryCount - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  };

  const addUser = async (userData: { 
    name: string; 
    email: string; 
    password: string; 
    role: 'admin' | 'user' 
  }): Promise<boolean> => {
    // Prevent concurrent operations
    if (operationInProgressRef.current === 'add') {
      console.warn("Add user operation already in progress");
      return false;
    }
    
    try {
      setIsLoading(true);
      operationInProgressRef.current = 'add';
      console.log("Adding new user:", userData.email);
      
      const email = userData.email.includes('@') ? userData.email : `${userData.email}@horeca.app`;
      
      const result = await retryOperation(async () => {
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
          throw new Error(error?.message || data?.error || 'Failed to add user');
        }
        
        return data;
      });

      console.log("User added successfully:", result);
      toast.success(`User ${userData.name} added successfully`);
      notifyUserDataChange();
      return true;
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to add user');
      return false;
    } finally {
      setIsLoading(false);
      operationInProgressRef.current = null;
    }
  };

  const updateUser = async (userId: string, userData: { 
    name?: string; 
    email?: string; 
    password?: string; 
    role?: 'admin' | 'user' 
  }): Promise<boolean> => {
    // Prevent concurrent operations
    if (operationInProgressRef.current === 'update') {
      console.warn("Update user operation already in progress");
      return false;
    }
    
    try {
      setIsLoading(true);
      operationInProgressRef.current = 'update';
      console.log("Updating user:", userId, userData);

      const updatePayload: any = { id: userId };
      
      if (userData.email) updatePayload.email = userData.email;
      if (userData.password) updatePayload.password = userData.password;
      
      if (userData.name || userData.role) {
        updatePayload.user_metadata = {};
        if (userData.name) updatePayload.user_metadata.name = userData.name;
        if (userData.role) updatePayload.user_metadata.role = userData.role;
      }

      console.log("Update payload:", updatePayload);
      
      const result = await retryOperation(async () => {
        const { data, error } = await supabase.functions.invoke('admin', {
          method: 'POST',
          body: {
            action: 'updateUser',
            userData: updatePayload
          }
        });
        
        if (error || data?.error) {
          throw new Error(error?.message || data?.error || 'Failed to update user');
        }
        
        return data;
      });

      console.log("User updated successfully:", result);
      toast.success('User updated successfully');
      notifyUserDataChange();
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to update user');
      return false;
    } finally {
      setIsLoading(false);
      operationInProgressRef.current = null;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    // Prevent concurrent operations
    if (operationInProgressRef.current === 'delete') {
      console.warn("Delete user operation already in progress");
      return false;
    }
    
    try {
      setIsLoading(true);
      operationInProgressRef.current = 'delete';
      console.log("Deleting user:", userId);

      const result = await retryOperation(async () => {
        const { data, error } = await supabase.functions.invoke('admin', {
          method: 'POST',
          body: {
            action: 'deleteUser',
            userData: { id: userId }
          }
        });
        
        if (error || data?.error) {
          throw new Error(error?.message || data?.error || 'Failed to delete user');
        }
        
        return data;
      });

      console.log("User deleted successfully");
      toast.success('User deleted successfully');
      notifyUserDataChange();
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to delete user');
      return false;
    } finally {
      setIsLoading(false);
      operationInProgressRef.current = null;
    }
  };

  return {
    addUser,
    updateUser,
    deleteUser,
    isLoading
  };
}
