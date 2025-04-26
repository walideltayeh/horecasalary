
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Index = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    console.log("Index page - Current user:", user);
    
    // If user exists, perform full page redirect
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
  
  // This will display briefly during redirect
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirecting...</p>
    </div>
  );
};

export default Index;
