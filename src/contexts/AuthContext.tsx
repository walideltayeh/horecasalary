
import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { User } from '@/types';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useUserManagement } from '@/hooks/auth/useUserManagement';

type AuthContextType = {
  user: User | null;
  users: User[];
  isAdmin: boolean;
  isLoading: boolean;
  isLoadingUsers: boolean;
  error: string | null;
  session: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addUser: (userData: { name: string, email: string, password: string, role: 'admin' | 'user' }) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, userData: { name?: string, password?: string, role?: 'admin' | 'user' }) => Promise<boolean>;
  fetchUsers: (force?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, users, setUsers, isLoading, isLoadingUsers, error, session, fetchUsers, isAdmin } = useAuthState();
  const { login, logout } = useAuthActions();
  const { addUser, deleteUser, updateUser } = useUserManagement();

  // Simplified debug logging
  useEffect(() => {
    console.log("AuthContext state:", { 
      userId: user?.id, 
      userRole: user?.role,
      isAdmin, 
      usersLoaded: users.length,
      isLoading
    });
  }, [user?.id, user?.role, isAdmin, users.length, isLoading]);

  const value = useMemo(
    () => ({
      user,
      users,
      isAdmin,
      isLoading,
      isLoadingUsers,
      error,
      session,
      login,
      logout,
      addUser,
      deleteUser,
      updateUser,
      fetchUsers,
    }),
    [user, users, isAdmin, isLoading, isLoadingUsers, error, session, login, logout, addUser, deleteUser, updateUser, fetchUsers]
  );

  return (
    <AuthContext.Provider value={value}>
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
