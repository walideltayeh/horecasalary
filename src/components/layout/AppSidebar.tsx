
import React from 'react';
import { Link } from 'react-router-dom';
import { Building, BarChart2, Settings, LogOut, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';

interface AppSidebarProps {
  user: {
    name: string;
    role: string;
  };
  location: {
    pathname: string;
  };
}

const AppSidebar: React.FC<AppSidebarProps> = ({ user, location }) => {
  const isAdmin = user.role === 'admin';
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-custom-red text-white' : 'hover:bg-gray-200';
  };
  
  return (
    <div className="bg-[url('/cafe-background.jpg')] bg-cover bg-center w-64 flex flex-col text-white">
      <div className="bg-black bg-opacity-70 flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">HoReCa Salary App</h1>
        </div>
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <Link to="/dashboard" className={`flex items-center p-2 rounded-md ${isActive('/dashboard')}`}>
              <BarChart2 className="mr-2 h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/cafe-management" className={`flex items-center p-2 rounded-md ${isActive('/cafe-management')}`}>
              <Building className="mr-2 h-5 w-5" />
              <span>Cafe Management</span>
            </Link>
            {isAdmin && (
              <Link to="/kpi-settings" className={`flex items-center p-2 rounded-md ${isActive('/kpi-settings')}`}>
                <Settings className="mr-2 h-5 w-5" />
                <span>KPI Settings</span>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className={`flex items-center p-2 rounded-md ${isActive('/admin')}`}>
                <Users className="mr-2 h-5 w-5" />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>
        <UserProfileSection user={user} />
      </div>
    </div>
  );
};

interface UserProfileSectionProps {
  user: {
    name: string;
    role: string;
  };
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({ user }) => {
  const { logout } = useAuth();
  
  return (
    <div className="p-4 border-t border-gray-700">
      <div className="flex items-center mb-2">
        <div className="bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-gray-800 font-bold mr-2">
          {user.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs">{user.role}</p>
        </div>
      </div>
      <Button 
        onClick={logout} 
        variant="outline" 
        className="w-full flex items-center justify-center bg-transparent text-white border-white hover:bg-white hover:text-black"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Logout</span>
      </Button>
    </div>
  );
};

export default AppSidebar;
