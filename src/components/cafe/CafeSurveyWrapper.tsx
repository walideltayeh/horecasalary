
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CirclePlus } from 'lucide-react';
import CafeBrandSurvey from '../CafeBrandSurvey';
import { CafeFormState } from './types/CafeFormTypes';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Check } from 'lucide-react';

interface CafeSurveyWrapperProps {
  onPreSubmit?: (cafeData: CafeFormState & { latitude: number, longitude: number }) => Promise<boolean>;
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
  const { user } = useAuth();

  // Update local state when external surveyCompleted prop changes
  React.useEffect(() => {
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

  // Render the survey button with conditional styling
  const renderSurveyButton = () => {
    if (!currentFormData && !onFormChange) return null;

    const isDisabled = !currentFormData || currentFormData.numberOfHookahs === 0;
    const isCompleted = surveyCompleted;

    return (
      <div className="w-full mt-4">
        <Card className="bg-[#1a365d]">
          <CardContent className="p-6">
            <Button
              type="button"
              variant={isCompleted ? "outline" : "default"}
              className={`w-full font-bold text-white ${
                isDisabled 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : isCompleted
                  ? 'border-green-500 text-green-500 hover:bg-green-50'
                  : 'bg-[#1a365d] text-white hover:bg-[#2a4365]'
              }`}
              disabled={isDisabled}
              onClick={() => setShowSurvey(true)}
            >
              {isCompleted ? (
                <>
                  <Check className="mr-2" />
                  <span className="font-bold">Survey Completed</span>
                </>
              ) : (
                <>
                  <CirclePlus className="mr-2" />
                  <span className="font-bold text-white">
                    {isDisabled ? 'Survey Not Required' : 'Complete Brand Survey'}
                  </span>
                </>
              )}
            </Button>

            {showSurvey && currentFormData && (
              <div className="mt-4">
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return renderSurveyButton();
};

export default CafeSurveyWrapper;

