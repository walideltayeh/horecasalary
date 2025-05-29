
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PasswordProtection from '@/components/PasswordProtection';
import UserHeader from '@/components/layout/UserHeader';
import UserNavigation from '@/components/layout/UserNavigation';
import UserDashboard from '@/components/UserDashboard';
import CafeList from '@/components/CafeList';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import { useLogoutHandler } from '@/hooks/useLogoutHandler';
import { DataProvider } from '@/contexts/DataContext';

const UserApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { handleLogout, isLoggingOut } = useLogoutHandler();

  console.log("UserApp render - user:", user?.id, "loading:", isLoading, "passwordVerified:", isPasswordVerified);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-red mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("UserApp: No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    console.log("UserApp: Admin user detected, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  if (!isPasswordVerified) {
    return (
      <PasswordProtection 
        onAuthenticate={() => setIsPasswordVerified(true)}
        title="User Application"
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <UserDashboard />;
      case 'cafes':
        return <CafeList />;
      case 'survey':
        return <CafeBrandSurvey />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50">
        <UserHeader 
          user={user} 
          onLogout={handleLogout} 
          isLoggingOut={isLoggingOut}
        />
        
        <UserNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <main className="container mx-auto px-4 py-6">
          {renderContent()}
        </main>
      </div>
    </DataProvider>
  );
};

export default UserApp;
