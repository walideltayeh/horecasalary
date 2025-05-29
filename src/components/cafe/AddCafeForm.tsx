
import React, { useState, useEffect } from 'react';
import { useCafeForm } from '@/hooks/useCafeForm';
import { CafeFormState } from './types/CafeFormTypes';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CafeFormFields from './form-sections/CafeFormFields';
import CafeSurveyWrapper from './CafeSurveyWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmitCafe } from '@/hooks/useSubmitCafe';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddCafeFormProps {
  onPreSubmit?: (cafeData: CafeFormState & { latitude: number, longitude: number }) => Promise<boolean>;
  surveyCompleted?: boolean;
  onFormChange?: (formData: CafeFormState) => void;
  onComplete?: () => void;
}

const AddCafeForm: React.FC<AddCafeFormProps> = ({ 
  onPreSubmit, 
  surveyCompleted: externalSurveyCompleted = false,
  onFormChange,
  onComplete
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [localSurveyCompleted, setLocalSurveyCompleted] = useState(externalSurveyCompleted);

  const {
    formState,
    handleInputChange,
    handleSelectChange,
    handleCaptureGPS,
    coordinates,
    getCafeSize,
    isCapturingLocation,
    showLocationDialog,
    setShowLocationDialog,
    resetForm
  } = useCafeForm();

  const { isSubmitting, handleSubmit: submitCafe } = useSubmitCafe({
    onPreSubmit,
    surveyCompleted: localSurveyCompleted,
    onSuccess: () => {
      resetForm();
      setLocalSurveyCompleted(false);
      if (onComplete) {
        onComplete();
      }
    }
  });

  // Update local state when external surveyCompleted prop changes
  useEffect(() => {
    setLocalSurveyCompleted(externalSurveyCompleted);
  }, [externalSurveyCompleted]);

  // Call onFormChange whenever formState changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange(formState);
    }
  }, [formState, onFormChange]);

  const handleSurveyComplete = () => {
    setLocalSurveyCompleted(true);
    if (onComplete) {
      onComplete();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitCafe(formState, coordinates);
    } catch (error) {
      console.error('Error submitting cafe:', error);
    }
  };

  // Show the form regardless of authentication status - but with appropriate messaging
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('cafe.form.add.title') || 'Add New Cafe'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Please log in to add cafes to the system.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cafe.form.add.title') || 'Add New Cafe'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <CafeFormFields
            formState={formState}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            handleStatusChange={handleSelectChange}
            getCafeSize={getCafeSize}
            coordinates={coordinates}
            availableCities={[]}
            setLocationCoordinates={() => {}}
            handleCaptureGPS={handleCaptureGPS}
            isCapturingLocation={isCapturingLocation}
            showLocationDialog={showLocationDialog}
            setShowLocationDialog={setShowLocationDialog}
          />
          
          <CafeSurveyWrapper
            surveyCompleted={localSurveyCompleted}
            onFormChange={onFormChange}
            currentFormData={formState}
            onSurveyComplete={handleSurveyComplete}
            onPreSubmit={onPreSubmit}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting || (formState.numberOfHookahs >= 1 && !localSurveyCompleted)}
              className="bg-custom-red hover:bg-red-700"
            >
              {isSubmitting ? 'Submitting...' : (t('cafe.form.submit') || 'Submit Cafe')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddCafeForm;
