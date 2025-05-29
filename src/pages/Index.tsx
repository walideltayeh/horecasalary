
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

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
  
  // Simple loading state with timeout
  if (isLoading) {
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
  
  // Simple redirect logic
  if (user) {
    const redirectPath = user.role === 'admin' ? '/dashboard' : '/user-app';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <Navigate to="/login" replace />;
};

export default Index;
