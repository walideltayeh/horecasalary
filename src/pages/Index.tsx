
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Index = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    console.log("Index page - Current user:", user);
  }, [user]);
  
  // Use React Router navigate for redirection
  if (user) {
    console.log("Index page - User authenticated, redirecting to:", user.role === 'admin' ? '/dashboard' : '/user-app');
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/user-app'} replace />;
  } else {
    console.log("Index page - No authenticated user, redirecting to login");
    return <Navigate to="/login" replace />;
  }
};

export default Index;
