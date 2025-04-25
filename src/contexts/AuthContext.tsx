
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Load users from localStorage on initial load
  useEffect(() => {
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
    
    // Setup Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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

    return () => {
      subscription.unsubscribe();
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
          
          toast.success(`Welcome, ${foundUser.name}! Your account has been migrated.`);
          return true;
        } else {
          toast.error('Invalid credentials');
          return false;
        }
      }
      
      if (data.user) {
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
      
      // Also add to local storage for backward compatibility
      const newUser: User = {
        id: data.user?.id || Date.now().toString(),
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
