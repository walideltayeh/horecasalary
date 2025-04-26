
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, isLoading } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  
  useEffect(() => {
    console.log("Index page - Current user:", user);
    console.log("Index page - Is loading:", isLoading);
    
    // Set a timeout to avoid infinite loading state
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user, isLoading]);
  
  // Show loading state while checking auth
  if (isLoading || localLoading) {
    console.log("Index page - Auth is still loading, showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-custom-red mb-4">HoReCa Salary App</h1>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-32 bg-gray-200" />
            <Skeleton className="h-10 w-40 bg-gray-200" />
          </div>
          <p className="mt-4 text-sm text-gray-500">If loading takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }
  
  // Once loaded or timeout reached, redirect based on auth state
  if (user) {
    const redirectPath = user.role === 'admin' ? '/dashboard' : '/user-app';
    console.log("Index page - User authenticated, redirecting to:", redirectPath);
    return <Navigate to={redirectPath} replace />;
  } else {
    console.log("Index page - No authenticated user, redirecting to login");
    return <Navigate to="/login" replace />;
  }
};

export default Index;
