
import React, { createContext, useContext } from 'react';
import { User } from '@/types';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';

type AuthContextType = {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
  session: any;
  addUser: (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => Promise<void>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'user' }) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, users, isLoading: stateLoading, session } = useAuthState();
  const { 
    login, 
    logout, 
    addUser, 
    updateUser, 
    deleteUser, 
    isLoading: actionLoading 
  } = useAuthActions();
  
  const isAdmin = user?.role === 'admin';
  const isLoading = stateLoading || actionLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        isAdmin,
        isLoading,
        session,
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
