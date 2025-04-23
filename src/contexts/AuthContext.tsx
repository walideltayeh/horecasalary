
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  addUser: (newUser: { email: string; name: string; password: string; role: 'admin' | 'user' }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample users for demonstration, moved it outside to store all users
const SAMPLE_USERS: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
    name: 'Admin User',
    password: 'password',
  },
  {
    id: '2',
    email: 'user@example.com',
    role: 'user',
    name: 'Regular User',
    password: 'password',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Check for stored users and current user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('horeca-user');
    const storedUsers = localStorage.getItem('horeca-users');
    
    // Set users from storage or use sample users
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(SAMPLE_USERS);
      localStorage.setItem('horeca-users', JSON.stringify(SAMPLE_USERS));
    }
    
    // Set current user if stored
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Find user from the users array
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      // Remove password from user object before storing
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('horeca-user', JSON.stringify(userWithoutPassword));
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

  const addUser = (newUser: { email: string; name: string; password: string; role: 'admin' | 'user' }) => {
    // Check if user already exists
    if (users.some(u => u.email === newUser.email)) {
      toast.error('A user with this email already exists');
      return;
    }

    // Create new user
    const user: User = {
      id: Date.now().toString(), // Generate a simple ID
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      password: newUser.password,
    };

    // Add to users array
    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    
    // Store in localStorage
    localStorage.setItem('horeca-users', JSON.stringify(updatedUsers));
    
    toast.success(`User ${newUser.name} has been added`);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        addUser
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
