
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddCafeForm from './AddCafeForm';
import CafeBrandSurvey from '../CafeBrandSurvey';
import { CafeFormState } from './types/CafeFormTypes';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Check, CirclePlus } from 'lucide-react';

const CafeSurveyWrapper: React.FC = () => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<CafeFormState | null>(null);
  const { user } = useAuth();

  const handleFormChange = (formData: CafeFormState) => {
    console.log("Form data changed:", formData);
    setCurrentFormData(formData);
    
    // Reset survey state when hookahs change to 0
    if (formData.numberOfHookahs === 0) {
      setSurveyCompleted(true); // Auto-complete for 0 hookahs
    }
  };

  const handlePreSubmit = async (cafeData: CafeFormState & { latitude: number, longitude: number }) => {
    console.log("Pre-submit handler called with data:", cafeData);
    
    if (cafeData.numberOfHookahs >= 1 && !surveyCompleted) {
      console.log("Survey required but not completed");
      toast.error("Please complete the brand survey before submitting");
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
  };

  // Render the survey button with conditional styling
  const renderSurveyButton = () => {
    if (!currentFormData) return null;

    const isDisabled = currentFormData.numberOfHookahs === 0;
    const isCompleted = surveyCompleted;

    return (
      <div className="mb-6">
        <Card className="bg-[#1a365d]">
          <CardContent className="p-6">
            <Button
              type="button"
              variant={isCompleted ? "outline" : "default"}
              className={`w-full font-bold ${
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
                  <span className="font-bold">
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

  return (
    <Card className="relative">
      <CardContent className="p-6">
        {renderSurveyButton()}
        <AddCafeForm
          onPreSubmit={handlePreSubmit}
          surveyCompleted={surveyCompleted}
          onFormChange={handleFormChange}
        />
      </CardContent>
    </Card>
  );
};

export default CafeSurveyWrapper;
