
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { CafeFormState } from './types/CafeFormTypes';
import SurveyButton from './survey/SurveyButton';
import SurveyForm from './survey/SurveyForm';

interface CafeSurveyWrapperProps {
  onPreSubmit?: (cafeData: CafeFormState & {
    latitude: number;
    longitude: number;
  }) => Promise<boolean>;
  surveyCompleted?: boolean;
  onFormChange?: (formData: CafeFormState) => void;
  currentFormData?: CafeFormState | null;
  onSurveyComplete?: () => void;
}

const CafeSurveyWrapper: React.FC<CafeSurveyWrapperProps> = ({
  onPreSubmit,
  surveyCompleted: externalSurveyCompleted = false,
  onFormChange,
  currentFormData,
  onSurveyComplete
}) => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(externalSurveyCompleted);

  useEffect(() => {
    setSurveyCompleted(externalSurveyCompleted);
  }, [externalSurveyCompleted]);

  const handleSurveyComplete = () => {
    console.log("Survey completed");
    setSurveyCompleted(true);
    setShowSurvey(false);
    toast.success("Survey completed! You can now submit the cafe.");
    if (onSurveyComplete) {
      onSurveyComplete();
    }
  };

  const handleCancelSurvey = () => {
    setShowSurvey(false);
  };

  if (!currentFormData && !onFormChange) return null;
  
  const isDisabled = !currentFormData || currentFormData.numberOfHookahs === 0;
  const isCompleted = surveyCompleted;

  return (
    <div className="w-full mt-4">
      <Card className="bg-white">
        <CardContent className="p-6 py-0 px-0">
          <SurveyButton 
            isDisabled={isDisabled} 
            isCompleted={isCompleted} 
            onClick={() => setShowSurvey(true)} 
          />

          {currentFormData && (
            <SurveyForm
              isVisible={showSurvey}
              cafeFormData={currentFormData}
              onComplete={handleSurveyComplete}
              onCancel={handleCancelSurvey}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CafeSurveyWrapper;
