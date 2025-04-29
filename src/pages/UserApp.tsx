
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Building, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import AddCafeForm from '@/components/cafe/AddCafeForm';
import CafeList from '@/components/CafeList';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { refreshCafeData } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const UserApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const mounted = useRef(true);
  
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

  const handleLogout = async () => {
    try {
      if (isLoggingOut) {
        console.log("Already processing logout, ignoring duplicate request");
        return;
      }
      
      setIsLoggingOut(true);
      console.log("UserApp: Starting logout process");
      
      await logout();
      
      console.log("UserApp: Logout complete, fallback redirect");
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false);
    }
  };

  const handleSurveyComplete = () => {
    setSurveyCompleted(true);
    toast.success("Survey completed, refreshing data...");
    refreshCafeData();
  };

  const renderCafeContent = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Cafe Management</h1>
          <p className="text-gray-600">Add and manage cafe information</p>
        </div>

        <AddCafeForm 
          surveyCompleted={surveyCompleted}
          onPreSubmit={async () => true}
          onComplete={handleSurveyComplete}
        />

        <Card>
          <CardHeader>
            <CardTitle>My Cafes</CardTitle>
            <CardDescription>List of cafes you've added</CardDescription>
          </CardHeader>
          <CardContent>
            <CafeList filterByUser={user?.id} />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-custom-red text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">HoReCa Mobile</h1>
          <div className="flex items-center">
            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-custom-red font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'cafe' && renderCafeContent()}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around">
          <button 
            className={`flex flex-col items-center p-4 ${activeTab === 'dashboard' ? 'text-custom-red' : 'text-gray-600'}`}
            onClick={() => setActiveTab('dashboard')}
            disabled={isLoggingOut}
          >
            <BarChart2 />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          
          <button 
            className={`flex flex-col items-center p-4 ${activeTab === 'cafe' ? 'text-custom-red' : 'text-gray-600'}`}
            onClick={() => setActiveTab('cafe')}
            disabled={isLoggingOut}
          >
            <Building />
            <span className="text-xs mt-1">Cafes</span>
          </button>
          
          <button 
            className="flex flex-col items-center p-4 text-gray-600"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut />
            <span className="text-xs mt-1">{isLoggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default UserApp;
