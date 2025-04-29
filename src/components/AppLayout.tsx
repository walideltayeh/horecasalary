
import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from './layout/AppSidebar';
import MainContent from './layout/MainContent';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AppSidebar user={user} location={location} />

      {/* Main content */}
      <MainContent>
        <Outlet />
      </MainContent>
    </div>
  );
};

export default AppLayout;
