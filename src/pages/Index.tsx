
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }
  
  // Show loading only for a short time during actual loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-custom-red mb-4">HoReCa Salary App</h1>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-32 bg-gray-200" />
            <Skeleton className="h-10 w-40 bg-gray-200" />
          </div>
          <p className="mt-4 text-sm text-gray-500">Loading your account...</p>
        </div>
      </div>
    );
  }
  
  // Simple redirect logic
  if (user) {
    const redirectPath = user.role === 'admin' ? '/dashboard' : '/user-app';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <Navigate to="/login" replace />;
};

export default Index;
