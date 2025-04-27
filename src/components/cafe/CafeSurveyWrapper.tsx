
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import AddCafeForm from './AddCafeForm';
import CafeBrandSurvey from '../CafeBrandSurvey';
import { CafeFormState } from './types/CafeFormTypes';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const CafeSurveyWrapper: React.FC = () => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<CafeFormState | null>(null);
  const { user } = useAuth();

  const handleFormChange = (formData: CafeFormState) => {
    console.log("Form data changed:", formData);
    setCurrentFormData(formData);
    
    // Reset survey if hookahs change to 0
    if (formData.numberOfHookahs === 0) {
      setShowSurvey(false);
      setSurveyCompleted(true);
    }
  };

  const handlePreSubmit = async (cafeData: CafeFormState & { latitude: number, longitude: number }) => {
    console.log("Pre-submit handler called with data:", cafeData);
    
    if (cafeData.numberOfHookahs >= 1 && !surveyCompleted) {
      console.log("Showing survey before final submission");
      setShowSurvey(true);
      return false;
    }
    
    return true;
  };

  const handleSurveyComplete = () => {
    console.log("Survey completed");
    setSurveyCompleted(true);
    setShowSurvey(false);
    toast.success("Survey completed! You can now submit the cafe.");
  };

  const handleCancelSurvey = () => {
    setShowSurvey(false);
    // Don't mark as completed, so form submission will still be blocked
  };
  
  // Debug logging
  useEffect(() => {
    console.log("CafeSurveyWrapper render state:", { 
      showSurvey, 
      surveyCompleted, 
      hasFormData: !!currentFormData,
      numberOfHookahs: currentFormData?.numberOfHookahs
    });
  }, [showSurvey, surveyCompleted, currentFormData]);

  return (
    <Card className="relative">
      <CardContent className="p-6">
        {showSurvey && currentFormData ? (
          <CafeBrandSurvey
            cafeFormData={{
              ...currentFormData,
              createdBy: user?.id || 'unknown',
              latitude: 0,
              longitude: 0,
              status: 'Pending'
            }}
            onComplete={handleSurveyComplete}
            onCancel={handleCancelSurvey}
          />
        ) : (
          <AddCafeForm
            onPreSubmit={handlePreSubmit}
            surveyCompleted={surveyCompleted}
            onFormChange={handleFormChange}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CafeSurveyWrapper;
