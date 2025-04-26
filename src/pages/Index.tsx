
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Index = () => {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    console.log("Index page - Current user:", user);
    console.log("Index page - Is loading:", isLoading);
  }, [user, isLoading]);
  
  // Show loading state while checking auth
  if (isLoading) {
    console.log("Index page - Auth is still loading, showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-custom-red mb-4">HoReCa Salary App</h1>
          <p className="mb-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Once loaded, redirect based on auth state
  if (user) {
    console.log("Index page - User authenticated, redirecting to:", user.role === 'admin' ? '/dashboard' : '/user-app');
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/user-app'} replace />;
  } else {
    console.log("Index page - No authenticated user, redirecting to login");
    return <Navigate to="/login" replace />;
  }
};

export default Index;
