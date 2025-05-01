
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import Dashboard from './Dashboard';
import NotFound from './NotFound';
import CafeManagement from './CafeManagement';
import KPISettings from './KPISettings';
import Admin from './Admin';
import { refreshCafeData } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Track if realtime has been initialized
let realtimeInitialized = false;

const UserApp = () => {
  const { user, isAdmin } = useAuth();
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  // Set up realtime subscriptions on mount
  useEffect(() => {
    const setupRealtime = async () => {
      if (realtimeInitialized) {
        console.log("Realtime already initialized, skipping");
        return;
      }
      
      try {
        console.log("Setting up realtime for critical tables");
        
        // Set up a channel for realtime updates
        const channel = supabase.channel('db-changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'cafes' },
            (payload) => {
              console.log("Cafe change detected:", payload);
              // Let the app know data has changed
              window.dispatchEvent(new CustomEvent('horeca_data_updated'));
            }
          )
          .subscribe((status) => {
            console.log(`Realtime subscription status: ${status}`);
            if (status === 'SUBSCRIBED') {
              setRealtimeEnabled(true);
              console.log("Realtime successfully enabled");
            }
          });
        
        realtimeInitialized = true;
        
        // Refresh data on mount
        await refreshCafeData();
        
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error("Error setting up realtime:", err);
      }
    };
    
    setupRealtime();
    
    // Refresh data on focus
    const handleFocus = async () => {
      console.log("Window focused, refreshing data");
      try {
        await refreshCafeData();
      } catch (err) {
        console.error("Error refreshing on focus:", err);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Directly return routes instead of wrapping them in AppLayout
  // AppLayout is now rendered within the routes
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cafe-management" element={<CafeManagement />} />
        <Route path="kpi-settings" element={<KPISettings />} />
        {isAdmin && <Route path="admin" element={<Admin />} />}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default UserApp;
