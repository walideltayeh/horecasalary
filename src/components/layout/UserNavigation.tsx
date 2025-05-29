
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Home, Coffee, BarChart3, LogOut } from 'lucide-react';

interface UserNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  isLoggingOut: boolean;
}

const UserNavigation: React.FC<UserNavigationProps> = ({
  activeTab,
  setActiveTab,
  handleLogout,
  isLoggingOut
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-cafe', label: 'Add Cafe', icon: Plus },
    { id: 'cafes', label: 'My Cafes', icon: Coffee },
    { id: 'survey', label: 'Survey', icon: BarChart3 }
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(item.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default UserNavigation;
