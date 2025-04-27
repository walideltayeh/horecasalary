
import React from 'react';
import { useCafeForm } from '@/hooks/useCafeForm';
import { CafeFormState } from './types/CafeFormTypes';
import { CafeFormLayout } from './layout/CafeFormLayout';
import { CafeBasicInfo } from './CafeBasicInfo';
import { CafeCapacityInfo } from './CafeCapacityInfo';
import { CafeLocationInfo } from './CafeLocationInfo';
import { PhotoUpload } from './PhotoUpload';
import { GPSCapture } from './GPSCapture';
import { useSubmitCafe } from '@/hooks/useSubmitCafe';
import CafeBrandSurvey from '../CafeBrandSurvey';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AddCafeFormProps {
  onPreSubmit?: (cafeData: CafeFormState & { latitude: number, longitude: number }) => Promise<boolean>;
  surveyCompleted?: boolean;
  onFormChange?: (formData: CafeFormState) => void;
}

const AddCafeForm: React.FC<AddCafeFormProps> = ({ 
  onPreSubmit, 
  surveyCompleted: externalSurveyCompleted = false,
  onFormChange
}) => {
  const { user } = useAuth();
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

  const { isSubmitting, handleSubmit: submitCafe } = useSubmitCafe({
    onPreSubmit,
    surveyCompleted: localSurveyCompleted
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formState.numberOfHookahs >= 1 && !localSurveyCompleted) {
      setShowSurvey(true);
      toast.info("Please complete the brand survey before submitting");
      return;
    }
    
    await submitCafe(formState, coordinates);
  };

  const handleSurveyComplete = () => {
    setLocalSurveyCompleted(true);
    setShowSurvey(false);
    toast.success("Survey completed! You can now submit the cafe.");
  };

  const handleCancelSurvey = () => {
    setShowSurvey(false);
  };

  return (
    <CafeFormLayout
      isSubmitting={isSubmitting}
      hasHookahs={formState.numberOfHookahs >= 1}
      surveyCompleted={localSurveyCompleted}
      onSubmit={handleSubmit}
    >
      <CafeBasicInfo 
        formState={formState} 
        onInputChange={handleInputChange} 
      />

      <CafeCapacityInfo 
        formState={formState} 
        onInputChange={handleInputChange}
        cafeSize={getCafeSize(formState.numberOfHookahs)}
      />

      <CafeLocationInfo 
        formState={formState} 
        onSelectChange={handleSelectChange}
        availableCities={[]}
      />

      <PhotoUpload 
        onPhotoChange={(photoUrl) => handleSelectChange('photoUrl', photoUrl)} 
      />

      <GPSCapture 
        coordinates={coordinates}
        onCaptureGPS={handleCaptureGPS}
        isCapturingLocation={isCapturingLocation}
        showLocationDialog={showLocationDialog}
        setShowLocationDialog={setShowLocationDialog}
      />

      {showSurvey && (
        <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white">
          <CafeBrandSurvey
            cafeFormData={{
              ...formState,
              createdBy: user?.id || 'unknown',
              latitude: coordinates.latitude || 0,
              longitude: coordinates.longitude || 0,
              status: 'Pending'
            }}
            onComplete={handleSurveyComplete}
            onCancel={handleCancelSurvey}
          />
        </div>
      )}
    </CafeFormLayout>
  );
};

export default AddCafeForm;
