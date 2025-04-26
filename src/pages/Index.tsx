
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Index = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    // Force a console log to check if user data is available
    console.log("Index page - Current user:", user);
    
    // If user exists, manually redirect to ensure full page reload
    if (user) {
      console.log("Index page - Redirecting authenticated user:", user.role);
      const redirectPath = user.role === 'admin' ? '/dashboard' : '/user-app';
      window.location.href = redirectPath;
    } else {
      console.log("Index page - No authenticated user, redirecting to login");
    }
  }, [user]);
  
  // If no user, use React Router navigate
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Return null during the redirect process
  return null;
};

export default Index;
