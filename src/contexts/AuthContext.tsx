
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample users for demonstration
const SAMPLE_USERS: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
    name: 'Admin User',
  },
  {
    id: '2',
    email: 'user@example.com',
    role: 'user',
    name: 'Regular User',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('horeca-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, you would validate against a backend
    // For demo, we'll use our sample users
    const foundUser = SAMPLE_USERS.find(u => u.email === email);
    
    if (foundUser && password === 'password') { // Simple password for demo
      setUser(foundUser);
      localStorage.setItem('horeca-user', JSON.stringify(foundUser));
      toast.success(`Welcome, ${foundUser.name}`);
      return true;
    }
    
    toast.error('Invalid email or password');
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('horeca-user');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin'
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
