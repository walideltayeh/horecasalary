
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from 'lucide-react';

interface SecureAccessProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  fallbackMessage?: string;
}

const SecureAccess: React.FC<SecureAccessProps> = ({ 
  children, 
  requiredRole = 'user',
  fallbackMessage = "You don't have permission to access this content."
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-red mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access this content.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a 
              href="/login" 
              className="text-custom-red hover:underline"
            >
              Go to Login
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldAlert className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              {fallbackMessage}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default SecureAccess;
