
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateEmail, validatePassword, sanitizeInput } from '@/utils/inputValidation';

export function useUserManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const operationInProgressRef = useRef<string | null>(null);

  const notifyUserDataChange = () => {
    try {
      localStorage.setItem('users_updated', String(Date.now()));
    } catch (e) {
      console.warn("Failed to update localStorage for cross-tab sync");
    }
  };

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
    if (operationInProgressRef.current === 'add') {
      console.warn("Add user operation already in progress");
      return false;
    }
    
    try {
      setIsLoading(true);
      operationInProgressRef.current = 'add';
      
      // Enhanced input validation
      const sanitizedName = sanitizeInput(userData.name);
      const sanitizedEmail = sanitizeInput(userData.email.toLowerCase());
      
      if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 50) {
        toast.error('Name must be between 2 and 50 characters');
        return false;
      }
      
      if (!validateEmail(sanitizedEmail)) {
        toast.error('Please enter a valid email address');
        return false;
      }
      
      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        toast.error(`Password validation failed: ${passwordValidation.errors[0]}`);
        return false;
      }
      
      if (!['admin', 'user'].includes(userData.role)) {
        toast.error('Invalid role specified');
        return false;
      }
      
      console.log("Adding new user with enhanced validation:", sanitizedEmail);
      
      const email = sanitizedEmail.includes('@') ? sanitizedEmail : `${sanitizedEmail}@horeca.app`;
      
      const result = await retryOperation(async () => {
        const { data, error } = await supabase.functions.invoke('admin', {
          method: 'POST',
          body: {
            action: 'createUser',
            userData: {
              email: email,
              password: userData.password,
              name: sanitizedName,
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
      toast.success(`User ${sanitizedName} added successfully`);
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
    if (operationInProgressRef.current === 'update') {
      console.warn("Update user operation already in progress");
      return false;
    }
    
    try {
      setIsLoading(true);
      operationInProgressRef.current = 'update';
      
      // Input validation
      const updatePayload: any = { id: userId };
      
      if (userData.name !== undefined) {
        const sanitizedName = sanitizeInput(userData.name);
        if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 50) {
          toast.error('Name must be between 2 and 50 characters');
          return false;
        }
        updatePayload.user_metadata = { ...updatePayload.user_metadata, name: sanitizedName };
      }
      
      if (userData.email !== undefined) {
        const sanitizedEmail = sanitizeInput(userData.email.toLowerCase());
        if (!validateEmail(sanitizedEmail)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        updatePayload.email = sanitizedEmail;
      }
      
      if (userData.password !== undefined) {
        const passwordValidation = validatePassword(userData.password);
        if (!passwordValidation.isValid) {
          toast.error(`Password validation failed: ${passwordValidation.errors[0]}`);
          return false;
        }
        updatePayload.password = userData.password;
      }
      
      if (userData.role !== undefined) {
        if (!['admin', 'user'].includes(userData.role)) {
          toast.error('Invalid role specified');
          return false;
        }
        updatePayload.user_metadata = { ...updatePayload.user_metadata, role: userData.role };
      }

      console.log("Update payload with validation:", updatePayload);
      
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
    if (operationInProgressRef.current === 'delete') {
      console.warn("Delete user operation already in progress");
      return false;
    }
    
    try {
      setIsLoading(true);
      operationInProgressRef.current = 'delete';
      
      // Input validation
      if (!userId || typeof userId !== 'string') {
        toast.error('Invalid user ID');
        return false;
      }
      
      console.log("Deleting user with validation:", userId);

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
