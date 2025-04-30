
import React, { useState, useEffect } from 'react';
import { useCafeForm } from '@/hooks/useCafeForm';
import { CafeFormState } from './types/CafeFormTypes';
import { CafeFormLayout } from './layout/CafeFormLayout';
import { CafeSubmitHandler } from './form-handlers/CafeSubmitHandler';
import CafeFormFields from './form-sections/CafeFormFields';
import { CafeSurveySection } from './form-sections/CafeSurveySection';
import CafeSurveyWrapper from './CafeSurveyWrapper';

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
  const [showSurvey, setShowSurvey] = useState(false);
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
    setShowLocationDialog
  } = useCafeForm();

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

  const handleShowSurvey = () => {
    setShowSurvey(true);
  };

  const handleSurveyComplete = () => {
    setLocalSurveyCompleted(true);
    setShowSurvey(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleCancelSurvey = () => {
    setShowSurvey(false);
  };

  return (
    <CafeFormLayout
      isSubmitting={false}
      hasHookahs={formState.numberOfHookahs >= 1}
      surveyCompleted={localSurveyCompleted}
      onSubmit={() => {}}
    >
      <CafeSubmitHandler
        formState={formState}
        coordinates={coordinates}
        surveyCompleted={localSurveyCompleted}
        onPreSubmit={onPreSubmit}
        onShowSurvey={handleShowSurvey}
      >
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
          onFormChange={(formData) => {
            if (onFormChange) {
              onFormChange(formData);
            }
          }}
          currentFormData={formState}
          onSurveyComplete={handleSurveyComplete}
          onPreSubmit={onPreSubmit}
        />

        <CafeSurveySection 
          showSurvey={showSurvey}
          formState={formState}
          coordinates={coordinates}
          onSurveyComplete={handleSurveyComplete}
          onCancelSurvey={handleCancelSurvey}
        />
      </CafeSubmitHandler>
    </CafeFormLayout>
  );
};

export default AddCafeForm;
