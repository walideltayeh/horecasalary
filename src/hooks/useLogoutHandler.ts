
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useLogoutHandler = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      if (isLoggingOut) {
        console.log("Already processing logout, ignoring duplicate request");
        return;
      }
      
      setIsLoggingOut(true);
      console.log("UserApp: Starting logout process");
      
      await logout();
      
      console.log("UserApp: Logout complete, fallback redirect");
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false);
    }
  };

  return { handleLogout, isLoggingOut };
};
