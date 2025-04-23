
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Building, BarChart2, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import CafeManagement from './CafeManagement';

const UserApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  
  if (!user || user.role === 'admin') {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-custom-red text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">HoReCa Mobile</h1>
          <div className="flex items-center">
            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-custom-red font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'cafe' && <CafeManagement />}
      </main>
      
      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around">
          <button 
            className={`flex flex-col items-center p-4 ${activeTab === 'dashboard' ? 'text-custom-red' : 'text-gray-600'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart2 />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          
          <button 
            className={`flex flex-col items-center p-4 ${activeTab === 'cafe' ? 'text-custom-red' : 'text-gray-600'}`}
            onClick={() => setActiveTab('cafe')}
          >
            <Building />
            <span className="text-xs mt-1">Cafes</span>
          </button>
          
          <button 
            className="flex flex-col items-center p-4 text-gray-600"
            onClick={handleLogout}
          >
            <LogOut />
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default UserApp;
