
import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import UserHeader from '@/components/layout/UserHeader';
import UserNavigation from '@/components/layout/UserNavigation';
import CafeContent from '@/components/cafe/CafeContent';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useLogoutHandler } from '@/hooks/useLogoutHandler';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const UserApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const mounted = useRef(true);
  const { handleLogout, isLoggingOut } = useLogoutHandler();
  
  // Set up realtime subscription for cafe changes and force data refresh on mount
  useEffect(() => {
    mounted.current = true;
    
    // Force data refresh on mount to ensure accurate counts
    const triggerInitialRefresh = () => {
      console.log("Triggering initial force refresh");
      const event = new CustomEvent('horeca_data_updated', {
        detail: { action: 'cafeCreated', forceRefresh: true }
      });
      window.dispatchEvent(event);
    };
    
    // Trigger refresh after a short delay to ensure components are mounted
    setTimeout(triggerInitialRefresh, 500);
    
    // Set up realtime subscription for cafe changes
    const channel = supabase.channel('public:cafes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'cafes' 
      }, (payload) => {
        console.log('Realtime change detected:', payload);
        
        // Dispatch an event to notify all components about the data change
        const event = new CustomEvent('horeca_data_updated', {
          detail: { action: 'realtimeUpdate', payload, forceRefresh: true }
        });
        window.dispatchEvent(event);
        
        // Show toast notification for data changes
        toast.info('Cafe data updated in real-time');
        
        // Ensure data is also propagated to admin
        window.dispatchEvent(new CustomEvent('global_data_refresh'));
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          // Try to enable realtime via edge function
          supabase.functions.invoke('enable-realtime', { 
            body: { table_name: 'cafes' }
          }).then(({ error }) => {
            if (error) {
              console.error("Failed to enable realtime via edge function:", error);
            } else {
              console.log("Realtime subscription activated for cafes table");
            }
          });
        }
      });
    
    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
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
