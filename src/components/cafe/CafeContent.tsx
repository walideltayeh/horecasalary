
import React, { useEffect } from 'react';
import { User } from '@/types';
import AddCafeForm from './AddCafeForm';
import CafeList from '@/components/CafeList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from '@/contexts/DataContext';

interface CafeContentProps {
  user: User | null;
  surveyCompleted: boolean;
  onSurveyComplete: () => void;
}

const CafeContent: React.FC<CafeContentProps> = ({ user, surveyCompleted, onSurveyComplete }) => {
  const { refreshCafes } = useData();

  // Force initial data refresh on mount
  useEffect(() => {
    refreshCafes();
    
    // Also listen for stats update events
    const handleStatsUpdated = () => {
      console.log("CafeContent - Stats updated event received");
      refreshCafes();
    };
    
    window.addEventListener('cafe_stats_updated', handleStatsUpdated);
    return () => {
      window.removeEventListener('cafe_stats_updated', handleStatsUpdated);
    };
  }, [refreshCafes]);
  
  const handleSurveyComplete = () => {
    onSurveyComplete();
    
    // Force a refresh after survey completion
    const event = new CustomEvent('horeca_data_updated', { 
      detail: { action: 'cafeCreated', forceRefresh: true }
    });
    window.dispatchEvent(event);
    
    // Also trigger a stats update
    window.dispatchEvent(new CustomEvent('cafe_stats_updated'));
  };

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

export default CafeContent;
