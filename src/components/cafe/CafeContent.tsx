
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
  const { refreshCafes } = useData();
  const { t } = useLanguage();
  const [formKey, setFormKey] = useState<number>(0); // Add a key to force re-render

  // Force immediate data refresh on mount
  useEffect(() => {
    console.log("CafeContent - Initial data refresh");
    refreshCafes(true);
    
    // Listen for data update events that should trigger a refresh
    const handleDataUpdate = () => {
      console.log("CafeContent - Data update event received, refreshing");
      refreshCafes(true);
    };
    
    // Listen for cafe added event
    const handleCafeAdded = () => {
      console.log("Cafe added, forcing form reset");
      setFormKey(prev => prev + 1); // Increment key to force form re-render
      refreshCafes(true);
    };
    
    window.addEventListener('cafe_stats_updated', handleDataUpdate);
    window.addEventListener('cafe_added', handleCafeAdded);
    window.addEventListener('cafe_data_force_refresh', handleDataUpdate);
    
    return () => {
      window.removeEventListener('cafe_stats_updated', handleDataUpdate);
      window.removeEventListener('cafe_added', handleCafeAdded);
      window.removeEventListener('cafe_data_force_refresh', handleDataUpdate);
    };
  }, [refreshCafes]);
  
  const handleSurveyComplete = () => {
    onSurveyComplete();
    
    // Force a refresh after survey completion
    console.log("Survey completed - triggering refresh");
    refreshCafes(true);
    
    // Dispatch events to ensure all components update
    window.dispatchEvent(new CustomEvent('cafe_added'));
    window.dispatchEvent(new CustomEvent('cafe_stats_updated'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{t('cafe.management.title')}</h1>
        <p className="text-gray-600">{t('cafe.management.subtitle')}</p>
      </div>

      <AddCafeForm 
        key={formKey} // Add key to force re-render when needed
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
