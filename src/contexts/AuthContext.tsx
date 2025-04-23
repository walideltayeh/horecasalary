
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  addUser: (userData: { name: string; password: string; role: 'admin' | 'user' }) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Load user and users from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('horeca-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const storedUsers = localStorage.getItem('horeca-users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Default admin user
      const defaultAdmin: User = {
        id: 'admin',
        email: '',
        name: 'Admin',
        role: 'admin',
        password: 'AlFakher2025',
      };
      setUsers([defaultAdmin]);
      localStorage.setItem('horeca-users', JSON.stringify([defaultAdmin]));
    }
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('horeca-users', JSON.stringify(users));
    }
  }, [users]);

  const login = (name: string, password: string): boolean => {
    // Find user with matching credentials
    const foundUser = users.find(u => 
      (u.email === name || u.name === name) && u.password === password
    );
    
    if (foundUser) {
      // Create a clone without the password for security
      const { password, ...secureUser } = foundUser;
      setUser(secureUser);
      localStorage.setItem('horeca-user', JSON.stringify(secureUser));
      toast.success(`Welcome, ${secureUser.name}!`);
      return true;
    } else {
      toast.error('Invalid credentials');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('horeca-user');
    toast.info('Logged out successfully');
  };

  const addUser = (userData: { name: string; password: string; role: 'admin' | 'user' }) => {
    const newUser: User = {
      id: Date.now().toString(),
      email: '',
      ...userData,
    };
    
    setUsers(prev => [...prev, newUser]);
    toast.success(`User ${userData.name} added successfully`);
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
