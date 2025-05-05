
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import UserHeader from '@/components/layout/UserHeader';
import UserNavigation from '@/components/layout/UserNavigation';
import CafeContent from '@/components/cafe/CafeContent';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useLogoutHandler } from '@/hooks/useLogoutHandler';

const UserApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const mounted = useRef(true);
  const refreshTriggeredRef = useRef(false);
  const { handleLogout, isLoggingOut } = useLogoutHandler();
  
  // Handle data refresh with improved performance
  useEffect(() => {
    mounted.current = true;
    
    // Only trigger a refresh once when the component first mounts
    if (!refreshTriggeredRef.current) {
      refreshTriggeredRef.current = true;
      
      // Use a small delay to ensure context is ready
      const timer = setTimeout(() => {
        if (mounted.current) {
          console.log("UserApp - Initial data refresh");
          const event = new CustomEvent('horeca_data_updated', {
            detail: { action: 'cafeCreated', forceRefresh: true }
          });
          window.dispatchEvent(event);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      mounted.current = false;
    };
  }, []);
  
  // Memoize handler function
  const handleSurveyComplete = useCallback(() => {
    setSurveyCompleted(true);
  }, []);

  // Redirect if not a user
  if (!user || user.role === 'admin') {
    return <Navigate to="/login" />;
  }

  // Render specific tab content to prevent unnecessary re-renders
  const renderActiveTabContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <ErrorBoundary fallback={<p>Error loading dashboard. Please try the Cafe tab instead.</p>}>
          <Dashboard />
        </ErrorBoundary>
      );
    }
    
    if (activeTab === 'cafe') {
      return (
        <CafeContent 
          user={user} 
          surveyCompleted={surveyCompleted} 
          onSurveyComplete={handleSurveyComplete} 
        />
      );
    }
    
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <UserHeader user={user} />
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {renderActiveTabContent()}
      </main>
      
      <UserNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  );
};

export default React.memo(UserApp);
