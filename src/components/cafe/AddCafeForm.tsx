
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
    surveyCompleted
  });

  // Call onFormChange whenever formState changes
  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(formState);
    }
  }, [formState, onFormChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCafe(formState, coordinates);
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
    </CafeFormLayout>
  );
};

export default AddCafeForm;
