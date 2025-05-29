
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Add timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, []);
  
  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }
  
  // Show loading with timeout protection
  if (isLoading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-custom-red mb-4">HoReCa Salary App</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-red mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If timeout reached and still loading, force redirect to login
  if (isLoading && timeoutReached) {
    console.log("Index: Loading timeout reached, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user state
  if (user) {
    const redirectPath = user.role === 'admin' ? '/dashboard' : '/user-app';
    console.log("Index: User found, redirecting to:", redirectPath);
    return <Navigate to={redirectPath} replace />;
  }
  
  console.log("Index: No user, redirecting to login");
  return <Navigate to="/login" replace />;
};

export default Index;
