
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, isLoading, session } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  useEffect(() => {
    console.log("Index page - Current user:", user);
    console.log("Index page - Current session:", session);
    console.log("Index page - Is loading:", isLoading);
    
    // Shorter timeout to prevent infinite loading
    const timer = setTimeout(() => {
      console.log("Index page - Timeout reached, proceeding with redirect");
      setTimeoutReached(true);
    }, 3000); // Reduced from 2000 to 3000ms
    
    return () => clearTimeout(timer);
  }, [user, isLoading, session]);
  
  // If we have a clear auth state or timeout reached, proceed with redirect
  if (timeoutReached || (!isLoading && (user !== undefined))) {
    if (user) {
      const redirectPath = user.role === 'admin' ? '/dashboard' : '/user-app';
      console.log("Index page - User authenticated, redirecting to:", redirectPath);
      return <Navigate to={redirectPath} replace />;
    } else {
      console.log("Index page - No authenticated user, redirecting to login");
      return <Navigate to="/login" replace />;
    }
  }
  
  // Show loading state only when actually loading
  if (isLoading && !timeoutReached) {
    console.log("Index page - Auth is still loading, showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-custom-red mb-4">HoReCa Salary App</h1>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-32 bg-gray-200" />
            <Skeleton className="h-10 w-40 bg-gray-200" />
          </div>
          <p className="mt-4 text-sm text-gray-500">Loading your account...</p>
          <div className="text-xs text-center mt-4 text-gray-500">
            Good Luck
          </div>
        </div>
      </div>
    );
  }
  
  // If somehow we get here, redirect to login as fallback
  return <Navigate to="/login" replace />;
};

export default Index;
