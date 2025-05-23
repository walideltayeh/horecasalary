
import React from 'react';
import { BarChart2, Building, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around">
        <button 
          className={`flex flex-col items-center p-4 ${activeTab === 'dashboard' ? 'text-custom-red' : 'text-gray-600'}`}
          onClick={() => setActiveTab('dashboard')}
          disabled={isLoggingOut}
        >
          <BarChart2 />
          <span className="text-xs mt-1">{t('nav.dashboard')}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center p-4 ${activeTab === 'cafe' ? 'text-custom-red' : 'text-gray-600'}`}
          onClick={() => setActiveTab('cafe')}
          disabled={isLoggingOut}
        >
          <Building />
          <span className="text-xs mt-1">{t('nav.cafes')}</span>
        </button>
        
        <button 
          className="flex flex-col items-center p-4 text-gray-600"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut />
          <span className="text-xs mt-1">{isLoggingOut ? t('app.logging.out') : t('app.logout')}</span>
        </button>
      </div>
    </nav>
  );
};

export default UserNavigation;
