
import React from 'react';
import { useCafes } from '@/contexts/CafeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCafeForm } from '@/hooks/useCafeForm';
import { CafeFormState } from './types/CafeFormTypes';
import { CafeFormLayout } from './layout/CafeFormLayout';
import { CafeBasicInfo } from './CafeBasicInfo';
import { CafeCapacityInfo } from './CafeCapacityInfo';
import { CafeLocationInfo } from './CafeLocationInfo';
import { PhotoUpload } from './PhotoUpload';
import { GPSCapture } from './GPSCapture';
import CafeSurveyWrapper from './CafeSurveyWrapper';

interface AddCafeFormProps {
  onPreSubmit?: (cafeData: CafeFormState & { latitude: number, longitude: number }) => Promise<boolean>;
  surveyCompleted?: boolean;
  onFormChange?: (formData: CafeFormState) => void;
}

const AddCafeForm: React.FC<AddCafeFormProps> = ({ 
  onPreSubmit, 
  surveyCompleted = false,
  onFormChange
}) => {
  const { user } = useAuth();
  const { addCafe } = useCafes();

  const {
    formState,
    isSubmitting,
    handleInputChange,
    handleSelectChange,
    handleSubmit: originalHandleSubmit,
    handleCaptureGPS,
    coordinates,
    getCafeSize,
    isCapturingLocation,
    showLocationDialog,
    setShowLocationDialog
  } = useCafeForm(async (cafeData) => {
    if (cafeData.numberOfHookahs >= 1 && !surveyCompleted) {
      console.log("Cafe has hookahs but survey not completed, checking with onPreSubmit...");
    }
    
    const completeData = {
      ...cafeData,
      createdBy: user?.id || 'unknown',
      status: 'Pending' as const
    };
    
    if (onPreSubmit) {
      const canSubmit = await onPreSubmit(completeData);
      if (!canSubmit) {
        return null;
      }
    }
    
    return await addCafe(completeData);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formState.numberOfHookahs >= 1 && !surveyCompleted) {
      await originalHandleSubmit(e);
    } else {
      await originalHandleSubmit(e);
    }
  };

  return (
    <CafeFormLayout
      isSubmitting={isSubmitting}
      hasHookahs={formState.numberOfHookahs >= 1}
      surveyCompleted={surveyCompleted}
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

      <CafeSurveyWrapper
        onPreSubmit={onPreSubmit}
        surveyCompleted={surveyCompleted}
        onFormChange={onFormChange}
      />
    </CafeFormLayout>
  );
};

export default AddCafeForm;
