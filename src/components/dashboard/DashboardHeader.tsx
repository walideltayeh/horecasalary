
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardHeaderProps {
  isAdmin: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isAdmin }) => {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
      <p className="text-gray-600">
        {isAdmin 
          ? t('dashboard.admin.subtitle')
          : t('dashboard.user.subtitle')
        }
      </p>
    </div>
  );
};

export default DashboardHeader;
