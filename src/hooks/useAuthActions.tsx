
import { useLogin } from './auth/useLogin';
import { useUserManagement } from './auth/useUserManagement';

export function useAuthActions() {
  const { login, logout, isLoading: authLoading } = useLogin();
  const { 
    addUser, 
    updateUser, 
    deleteUser, 
    isLoading: userManagementLoading 
  } = useUserManagement();

  return {
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    isLoading: authLoading || userManagementLoading
  };
}
