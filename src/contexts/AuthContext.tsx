
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  addUser: (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => Promise<void>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'user' }) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Fetch users from the new users table
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      if (data) {
        const mappedUsers: User[] = data.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role as 'admin' | 'user',
          password: u.password
        }));
        
        setUsers(mappedUsers);
        localStorage.setItem('horeca-users', JSON.stringify(mappedUsers));
      }
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
    }
  };

  // Authentication state and user fetching logic
  useEffect(() => {
    console.log("AuthContext: Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthContext: Auth state changed:", event, session?.user?.id);
        
        if (session && session.user) {
          // Fetch user details from the users table
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching user details:', error);
            return;
          }
          
          if (data) {
            const currentUser: User = {
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role as 'admin' | 'user',
              password: data.password
            };
            
            console.log("AuthContext: Setting user state:", currentUser);
            setUser(currentUser);
          }
        } else {
          console.log("AuthContext: No session, clearing user state");
          setUser(null);
        }
        
        // Fetch all users
        await fetchUsers();
      }
    );
    
    // Check for existing session on mount
    const checkExistingSession = async () => {
      console.log("AuthContext: Checking for existing session");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        return;
      }
      
      console.log("AuthContext: Existing session check result:", !!session);
      
      if (session && session.user) {
        // Fetch user details from the users table
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user details:', error);
          return;
        }
        
        if (data) {
          const currentUser: User = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role as 'admin' | 'user',
            password: data.password
          };
          
          console.log("AuthContext: Setting user from existing session:", currentUser);
          setUser(currentUser);
        }
      }
    };
    
    checkExistingSession();
    
    // Initial fetch of users
    fetchUsers();

    return () => {
      console.log("AuthContext: Cleaning up auth state subscription");
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("AuthContext: Attempting login with:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.includes('@') ? email : `${email}@horeca.app`,
        password: password,
      });
      
      if (error) {
        console.error("AuthContext: Login error:", error);
        toast.error('Invalid credentials');
        return false;
      }
      
      if (data.user) {
        console.log("AuthContext: Login successful for user:", data.user.id);
        toast.success(`Welcome, ${data.user.email}!`);
        
        // Session handling is done by onAuthStateChange
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    console.log("AuthContext: Logging out");
    await supabase.auth.signOut();
    // Session cleared by onAuthStateChange 
    toast.info('Logged out successfully');
  };

  // Add user function
  const addUser = async (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
    try {
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
    }
  };

  // Update user function
  const updateUser = async (userId: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'user' }): Promise<boolean> => {
    try {
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
        const { error: passwordError } = await supabase.auth.updateUser({
          password: userData.password
        });
        
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
    }
  };

  // Delete user function
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
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
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        isAdmin,
        addUser,
        deleteUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
