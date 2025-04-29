
import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import { refreshCafeData } from '@/integrations/supabase/client';
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
  const { handleLogout, isLoggingOut } = useLogoutHandler();
  
  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  
  // Initial data refresh only once when mounted
  useEffect(() => {
    console.log("UserApp mounted, refreshing data once");
    
    // Small delay to let other components initialize first
    const timeoutId = setTimeout(() => {
      if (mounted.current) {
        refreshCafeData();
        console.log("Initial cafe data refresh triggered");
      }
    }, 500);
    
    // Set up event listener for data updates
    const handleDataUpdated = () => {
      console.log("UserApp received data update event");
      // No need to do anything here, as CafeList handles its own updates
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
    };
  }, []);
  
  if (!user || user.role === 'admin') {
    return <Navigate to="/login" />;
  }

  const handleSurveyComplete = () => {
    setSurveyCompleted(true);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <UserHeader user={user} />
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'dashboard' ? (
          <ErrorBoundary fallback={<p>Error loading dashboard. Please try the Cafe tab instead.</p>}>
            <Dashboard />
          </ErrorBoundary>
        ) : null}
        
        {activeTab === 'cafe' && (
          <CafeContent 
            user={user} 
            surveyCompleted={surveyCompleted} 
            onSurveyComplete={handleSurveyComplete} 
          />
        )}
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

export default UserApp;
