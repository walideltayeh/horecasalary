
import React, { useEffect, useState } from 'react';
import { User } from '@/types';
import AddCafeForm from './AddCafeForm';
import CafeList from '@/components/CafeList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeContentProps {
  user: User | null;
  surveyCompleted: boolean;
  onSurveyComplete: () => void;
}

const CafeContent: React.FC<CafeContentProps> = ({ user, surveyCompleted, onSurveyComplete }) => {
  const { t } = useLanguage();
  const [formKey, setFormKey] = useState<number>(0);

  // Try to get refreshCafes if DataContext is available, but don't crash if it's not
  let refreshCafes: (() => Promise<void>) | undefined;
  try {
    const dataContext = useData();
    refreshCafes = dataContext.refreshCafes;
  } catch (error) {
    console.warn("DataContext not available, continuing without it");
  }

  // Force initial data refresh on mount if available
  useEffect(() => {
    if (refreshCafes) {
      refreshCafes();
    }
    
    // Listen for cafe added event
    const handleCafeAdded = () => {
      console.log("Cafe added, forcing form reset");
      setFormKey(prev => prev + 1);
    };
    
    window.addEventListener('cafe_added', handleCafeAdded);
    
    return () => {
      window.removeEventListener('cafe_added', handleCafeAdded);
    };
  }, [refreshCafes]);
  
  const handleSurveyComplete = () => {
    onSurveyComplete();
    
    // Force a refresh after survey completion
    const event = new CustomEvent('horeca_data_updated', { 
      detail: { action: 'cafeCreated', forceRefresh: true }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{t('cafe.management.title')}</h1>
        <p className="text-gray-600">{t('cafe.management.subtitle')}</p>
      </div>

      <AddCafeForm 
        key={formKey}
        surveyCompleted={surveyCompleted}
        onPreSubmit={async () => true}
        onComplete={handleSurveyComplete}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('cafe.my.cafes')}</CardTitle>
          <CardDescription>{t('cafe.list')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CafeList filterByUser={user?.id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CafeContent;
