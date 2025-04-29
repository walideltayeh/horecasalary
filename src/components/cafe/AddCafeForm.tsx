
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
import CafeSurveyWrapper from './CafeSurveyWrapper';
import { Label } from "@/components/ui/label";
import CafeStatusSelect from './CafeStatusSelect';

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
    
    // First, validate that all fields are filled
    const requiredFields = [
      { field: 'name', label: 'Cafe name' },
      { field: 'ownerName', label: 'Owner name' },
      { field: 'ownerNumber', label: 'Owner phone' },
      { field: 'governorate', label: 'Governorate' },
      { field: 'city', label: 'City' },
      { field: 'photoUrl', label: 'Cafe photo' },
      { field: 'numberOfHookahs', label: 'Number of hookahs' },
      { field: 'numberOfTables', label: 'Number of tables' }
    ];
    
    const missingFields = requiredFields
      .filter(({ field }) => {
        const value = formState[field as keyof CafeFormState];
        return value === undefined || value === null || value === '' || (typeof value === 'number' && value < 0);
      })
      .map(({ label }) => label);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(formState.ownerNumber.replace(/\D/g, ''))) {
      toast.error('Please enter a valid phone number (10-15 digits)');
      return;
    }
    
    // Validate GPS coordinates
    if (!coordinates.latitude || !coordinates.longitude) {
      toast.error('Please capture the GPS location');
      return;
    }
    
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
    if (onComplete) {
      onComplete();
    }
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

      {/* Add Status Selection Component */}
      <CafeStatusSelect
        selectedStatus={formState.status}
        onSelectChange={handleSelectChange}
      />

      <div className="space-y-2">
        <Label className="block">
          Cafe Photo <span className="text-red-500">*</span>
        </Label>
        <PhotoUpload 
          onPhotoChange={(photoUrl) => handleSelectChange('photoUrl', photoUrl)} 
        />
      </div>

      <div className="space-y-2">
        <Label className="block">
          GPS Location <span className="text-red-500">*</span>
        </Label>
        <GPSCapture 
          coordinates={coordinates}
          onCaptureGPS={handleCaptureGPS}
          isCapturingLocation={isCapturingLocation}
          showLocationDialog={showLocationDialog}
          setShowLocationDialog={setShowLocationDialog}
        />
      </div>

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

      {showSurvey && (
        <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white">
          <CafeBrandSurvey
            cafeFormData={{
              ...formState,
              createdBy: user?.id || 'unknown',
              latitude: coordinates.latitude || 0,
              longitude: coordinates.longitude || 0,
              status: formState.status
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
