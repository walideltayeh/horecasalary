
import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from './Dashboard';
import UserHeader from '@/components/layout/UserHeader';
import UserNavigation from '@/components/layout/UserNavigation';
import CafeContent from '@/components/cafe/CafeContent';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useLogoutHandler } from '@/hooks/useLogoutHandler';

const UserApp: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const mounted = useRef(true);
  const refreshTriggeredRef = useRef(false);
  const { handleLogout, isLoggingOut } = useLogoutHandler();
  
  // Clear notification timeouts on unmount and only refresh once on mount
  useEffect(() => {
    mounted.current = true;
    
    // Only trigger a refresh once when the component first mounts
    if (!refreshTriggeredRef.current) {
      refreshTriggeredRef.current = true;
      
      // Force data refresh on mount with a small delay to ensure context is ready
      setTimeout(() => {
        const event = new CustomEvent('horeca_data_updated', {
          detail: { action: 'cafeCreated', forceRefresh: true }
        });
        window.dispatchEvent(event);
      }, 300);
    }
    
    return () => {
      mounted.current = false;
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
