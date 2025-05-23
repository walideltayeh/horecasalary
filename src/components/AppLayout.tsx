
import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from './layout/AppSidebar';
import MainContent from './layout/MainContent';
import ErrorBoundary from './common/ErrorBoundary';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <ErrorBoundary fallback={<div className="p-4">Something went wrong. Please refresh the page.</div>}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <AppSidebar user={user} location={location} />

        {/* Main content */}
        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </ErrorBoundary>
  );
};

export default AppLayout;
