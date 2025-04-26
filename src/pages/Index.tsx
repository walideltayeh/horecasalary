
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Index = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    // Force a console log to check if user data is available
    console.log("Index page - Current user:", user);
  }, [user]);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/user-app" replace />;
  }
};

export default Index;
