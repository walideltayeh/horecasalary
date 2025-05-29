
import React, { useState, useEffect } from 'react';
import { useCafeForm } from '@/hooks/useCafeForm';
import { CafeFormState } from './types/CafeFormTypes';
import { CafeFormLayout } from './layout/CafeFormLayout';
import { CafeSubmitHandler } from './form-handlers/CafeSubmitHandler';
import CafeFormFields from './form-sections/CafeFormFields';
import CafeSurveyWrapper from './CafeSurveyWrapper';
import { useAuth } from '@/contexts/AuthContext';

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

  const handleFormSuccess = () => {
    // Reset the form after successful submission
    resetForm();
    setLocalSurveyCompleted(false);
  };

  // Show the form regardless of authentication status - but with appropriate messaging
  if (!user) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Add New Cafe</h2>
        <p className="text-gray-500">Please log in to add cafes to the system.</p>
      </div>
    );
  }

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
        onShowSurvey={() => {}}
        onSuccess={handleFormSuccess}
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
          onFormChange={onFormChange}
          currentFormData={formState}
          onSurveyComplete={handleSurveyComplete}
          onPreSubmit={onPreSubmit}
        />
      </CafeSubmitHandler>
    </CafeFormLayout>
  );
};

export default AddCafeForm;
