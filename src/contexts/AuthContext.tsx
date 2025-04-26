
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
  addUser: (userData: { name: string; password: string; role: 'admin' | 'user' }) => Promise<void>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, userData: { name?: string; password?: string; role?: 'admin' | 'user' }) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Load users from localStorage on initial load and set up real-time updates
  useEffect(() => {
    // Setup Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (session && session.user) {
          // Create a user object from Supabase session
          const userRole = session.user.user_metadata?.role || 'user';
          const supabaseUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: userRole === 'admin' ? 'admin' : 'user',
          };
          setUser(supabaseUser);
        } else {
          setUser(null);
        }
      }
    );
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        const userRole = session.user.user_metadata?.role || 'user';
        const supabaseUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: userRole === 'admin' ? 'admin' : 'user',
        };
        setUser(supabaseUser);
      }
    });

    // Fetch users from Supabase
    const fetchUsers = async () => {
      try {
        // First try to get users from Supabase
        const { data: userData, error } = await supabase
          .from('users')
          .select('*');
        
        if (error) {
          console.error('Error fetching users from Supabase:', error);
          // Fall back to localStorage
          const storedUsers = localStorage.getItem('horeca-users');
          if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
          } else {
            // Default admin user
            const defaultAdmin: User = {
              id: 'admin',
              email: 'admin@horeca.app',
              name: 'Admin',
              role: 'admin',
              password: 'AlFakher2025',
            };
            setUsers([defaultAdmin]);
            localStorage.setItem('horeca-users', JSON.stringify([defaultAdmin]));
          }
        } else if (userData && userData.length > 0) {
          // Map Supabase data to User type
          const mappedUsers = userData.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role as 'admin' | 'user',
            password: u.password
          }));
          
          setUsers(mappedUsers);
          // Also update localStorage for offline access
          localStorage.setItem('horeca-users', JSON.stringify(mappedUsers));
        } else {
          // No users in Supabase, fall back to localStorage
          const storedUsers = localStorage.getItem('horeca-users');
          if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
          } else {
            // Default admin user
            const defaultAdmin: User = {
              id: 'admin',
              email: 'admin@horeca.app',
              name: 'Admin',
              role: 'admin',
              password: 'AlFakher2025',
            };
            setUsers([defaultAdmin]);
            localStorage.setItem('horeca-users', JSON.stringify([defaultAdmin]));
            
            // Also try to save this user to Supabase
            try {
              await supabase.from('users').insert([{
                id: 'admin',
                email: 'admin@horeca.app',
                name: 'Admin',
                role: 'admin',
                password: 'AlFakher2025',
              }]);
            } catch (err) {
              console.error('Could not save default admin to Supabase:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error in user fetch process:', error);
      }
    };
    
    fetchUsers();
    
    // Subscribe to user changes
    const channel = supabase
      .channel('users_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      }, (payload) => {
        console.log('Users changed in database:', payload);
        fetchUsers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('horeca-users', JSON.stringify(users));
    }
  }, [users]);

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      // Special case for Admin user (should be handled in Login.tsx directly)
      if (name.toLowerCase() === 'admin') {
        // Admin authentication is handled in Login.tsx
        return false;
      }
      
      // For regular users, use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: name.includes('@') ? name : `${name}@horeca.app`,
        password: password,
      });
      
      if (error) {
        // If Supabase login fails, try legacy authentication
        // Find user with matching credentials in localStorage
        const foundUser = users.find(u => 
          (u.email === name || u.name === name) && u.password === password
        );
        
        if (foundUser) {
          // If found in legacy system, migrate to Supabase
          const email = foundUser.email || `${foundUser.name}@horeca.app`;
          
          // Create new user in Supabase
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: foundUser.name,
                role: foundUser.role,
              }
            }
          });
          
          if (signUpError) {
            toast.error('Failed to migrate account: ' + signUpError.message);
            return false;
          }
          
          // Login with newly created account
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (loginError) {
            toast.error('Login failed after migration: ' + loginError.message);
            return false;
          }
          
          // Also save to the users table
          try {
            const { error: insertError } = await supabase.from('users').insert([{
              id: signUpData.user?.id || foundUser.id,
              email: email,
              name: foundUser.name,
              role: foundUser.role,
              password: password
            }]);
            
            if (insertError) {
              console.error('Error saving user to users table:', insertError);
            }
          } catch (err) {
            console.error('Error in user table insert:', err);
          }
          
          toast.success(`Welcome, ${foundUser.name}! Your account has been migrated.`);
          return true;
        } else {
          toast.error('Invalid credentials');
          return false;
        }
      }
      
      if (data.user) {
        // Make sure this user is also in our users table
        try {
          const { data: existingUser, error: queryError } = await supabase
            .from('users')
            .select()
            .eq('id', data.user.id)
            .single();
            
          if (queryError || !existingUser) {
            // User doesn't exist in our table, add them
            await supabase.from('users').insert([{
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: data.user.user_metadata?.role || 'user',
              password: password // Store password for backwards compatibility
            }]);
          }
        } catch (err) {
          console.error('Error checking/saving user to users table:', err);
        }
        
        toast.success(`Welcome, ${data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'}!`);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred during login.');
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.info('Logged out successfully');
  };

  const addUser = async (userData: { name: string; password: string; role: 'admin' | 'user' }) => {
    try {
      const email = `${userData.name.toLowerCase().replace(/\s+/g, '.')}@horeca.app`;
      
      // Create user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          }
        }
      });
      
      if (error) throw error;
      
      const newUserId = data.user?.id || Date.now().toString();
      
      // Also add to users table for our application
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: newUserId,
          email,
          name: userData.name,
          role: userData.role,
          password: userData.password,
        }]);
        
      if (insertError) {
        console.error('Error adding user to users table:', insertError);
        throw insertError;
      }
      
      // Also add to local state
      const newUser: User = {
        id: newUserId,
        email,
        name: userData.name,
        role: userData.role,
        password: userData.password,
      };
      
      setUsers(prev => [...prev, newUser]);
      toast.success(`User ${userData.name} added successfully`);
    } catch (error: any) {
      toast.error(`Failed to add user: ${error.message || 'Unknown error'}`);
    }
  };

  const updateUser = async (userId: string, userData: { name?: string; password?: string; role?: 'admin' | 'user' }): Promise<boolean> => {
    try {
      // Check if trying to update admin
      if (userId === 'admin' && userData.role && userData.role !== 'admin') {
        toast.error("Cannot change the role of the main admin user");
        return false;
      }
      
      // Find the current user data to merge with updates
      const currentUser = users.find(u => u.id === userId);
      if (!currentUser) {
        toast.error("User not found");
        return false;
      }
      
      // Create updated user object
      const updatedUser: User = {
        ...currentUser,
        ...(userData.name && { name: userData.name }),
        ...(userData.password && { password: userData.password }),
        ...(userData.role && { role: userData.role }),
      };
      
      // Update in Supabase users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: updatedUser.name,
          role: updatedUser.role,
          ...(userData.password && { password: userData.password }),
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error("Error updating user in database:", updateError);
        toast.error("Failed to update user in database");
        return false;
      }
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      toast.success("User updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // Check if trying to delete admin
      if (userId === 'admin' || users.find(u => u.id === userId && u.role === 'admin' && u.name === 'Admin')) {
        toast.error("Cannot delete the main admin user");
        return false;
      }
      
      // Delete from Supabase users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (deleteError) {
        console.error("Error deleting from users table:", deleteError);
        toast.error("Error removing user from database");
        return false;
      }
      
      // Try to delete the auth user if this is a Supabase user
      try {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
          console.error("Failed to delete from Supabase auth:", error);
          // Continue anyway as we've already deleted from our users table
        }
      } catch (authError) {
        console.error("Error during auth user deletion:", authError);
        // Continue anyway
      }
      
      // Update local users list
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      toast.success("User deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
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
