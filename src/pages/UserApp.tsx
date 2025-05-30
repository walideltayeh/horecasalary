
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import UserHeader from '@/components/layout/UserHeader';
import UserNavigation from '@/components/layout/UserNavigation';
import UserDashboard from '@/components/UserDashboard';
import CafeList from '@/components/CafeList';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import AddCafeForm from '@/components/cafe/AddCafeForm';
import { useLogoutHandler } from '@/hooks/useLogoutHandler';
import EmergencyErrorBoundary from '@/components/common/EmergencyErrorBoundary';

const UserApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { handleLogout, isLoggingOut } = useLogoutHandler();

  console.log("UserApp render - user:", user?.id, "loading:", isLoading);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <UserDashboard userId={user.id} userName={user.name} />;
      case 'add-cafe':
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Add New Cafe</h2>
            <AddCafeForm 
              onComplete={() => {
                setActiveTab('cafes');
              }}
            />
          </div>
        );
      case 'cafes':
        return (
          <EmergencyErrorBoundary fallbackMessage="Error loading cafe list. Please refresh.">
            <CafeList />
          </EmergencyErrorBoundary>
        );
      case 'survey':
        return (
          <CafeBrandSurvey 
            cafeFormData={{
              name: '',
              ownerName: '',
              ownerNumber: '',
              numberOfHookahs: 0,
              numberOfTables: 0,
              governorate: '',
              city: '',
              status: 'Pending',
              photoUrl: '',
              createdBy: user.id,
              latitude: 0,
              longitude: 0
            }}
            onComplete={() => {}}
          />
        );
      default:
        return <UserDashboard userId={user.id} userName={user.name} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader user={user} />
      
      <UserNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
      
      <main className="container mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default UserApp;
