
import React, { createContext, useContext, useMemo } from 'react';
import { User } from '@/types';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useUserManagement } from '@/hooks/auth/useUserManagement';

type AuthContextType = {
  user: User | null;
  users: User[];
  isAdmin: boolean;
  isLoading: boolean;
  session: any;  // Adding session to the context type
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;  // Changed to void to match implementation
  addUser: (userData: { name: string, email: string, password: string, role: 'admin' | 'user' }) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, userData: { name?: string, password?: string, role?: 'admin' | 'user' }) => Promise<boolean>;
  fetchUsers: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, users, setUsers, isLoading, session, fetchUsers } = useAuthState();
  const { login, logout } = useAuthActions();
  const { addUser, deleteUser, updateUser } = useUserManagement();

  const isAdmin = useMemo(() => {
    return !!user && user.role === 'admin';
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      users,
      isAdmin,
      isLoading,
      session, // Expose session to the context
      login,
      logout,
      addUser,
      deleteUser,
      updateUser,
      fetchUsers,
    }),
    [user, users, isAdmin, isLoading, session, login, logout, addUser, deleteUser, updateUser, fetchUsers]
  );

  return (
    <AuthContext.Provider
      value={value}
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
