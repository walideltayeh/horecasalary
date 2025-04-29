
import React from 'react';
import { User } from '@/types';
import AddCafeForm from './AddCafeForm';
import CafeList from '@/components/CafeList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { refreshCafeData } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CafeContentProps {
  user: User | null;
  surveyCompleted: boolean;
  onSurveyComplete: () => void;
}

const CafeContent: React.FC<CafeContentProps> = ({ user, surveyCompleted, onSurveyComplete }) => {
  const handleSurveyComplete = () => {
    onSurveyComplete();
    toast.success("Survey completed, refreshing data...");
    refreshCafeData();
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
