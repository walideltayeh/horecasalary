
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { mexicoLocations } from '@/data/mexicoLocations';
import { useCafes } from '@/contexts/CafeContext';

import { CafeBasicInfo } from './CafeBasicInfo';
import { CafeCapacityInfo } from './CafeCapacityInfo';
import { CafeLocationInfo } from './CafeLocationInfo';
import { PhotoUpload } from './PhotoUpload';
import { GPSCapture } from './GPSCapture';
import { useCafeForm } from '@/hooks/useCafeForm';
import { CafeFormState } from './types/CafeFormTypes';

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
    // Prepare data for submission
    const completeData = {
      ...cafeData,
      createdBy: user?.id || 'unknown',
      status: 'Pending' as const
    };
    
    // If onPreSubmit is provided, use it to control submission
    if (onPreSubmit) {
      const canSubmit = await onPreSubmit(completeData);
      if (!canSubmit) {
        console.log("Submission paused for survey");
        return null; // Pause submission for survey
      }
    }
    
    // Default submission if no pre-submit handler or it allows submission
    console.log("Proceeding with cafe submission");
    return await addCafe(completeData);
  });

  // Custom submit handler that enforces survey completion for cafes with hookahs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For cafes with hookahs, require survey completion before final submission
    if (formState.numberOfHookahs >= 1 && !surveyCompleted) {
      console.log("Starting submission process with survey check");
      await originalHandleSubmit(e);
    } else {
      // For cafes without hookahs, or if survey is already completed
      console.log("Direct submission without survey");
      await originalHandleSubmit(e);
    }
  };

  // Custom input change handler that reports changes to parent
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    if (onFormChange) {
      const { name, value, type } = e.target;
      const updatedFormState = { 
        ...formState, 
        [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value 
      };
      onFormChange(updatedFormState);
    }
  };

  // Custom select change handler that reports changes to parent
  const handleFormSelectChange = (name: string, value: string) => {
    handleSelectChange(name, value);
    if (onFormChange) {
      onFormChange({
        ...formState,
        [name]: value
      });
    }
  };

  // Report initial form state to parent
  useEffect(() => {
    if (onFormChange) {
      onFormChange(formState);
    }
  }, [onFormChange]);

  const [availableCities, setAvailableCities] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (formState.governorate) {
      const selectedLocation = mexicoLocations.find(
        location => location.governorate === formState.governorate
      );
      
      if (selectedLocation) {
        setAvailableCities(selectedLocation.cities);
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [formState.governorate]);

  const cafeSize = getCafeSize(formState.numberOfHookahs);

  // Determine if form submission should be disabled
  const isSubmitDisabled = isSubmitting || 
    (formState.numberOfHookahs >= 1 && !surveyCompleted);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Cafe</CardTitle>
        <CardDescription>Enter cafe details to add to your database</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <CafeBasicInfo 
            formState={formState} 
            onInputChange={handleFormInputChange} 
          />

          <CafeCapacityInfo 
            formState={formState} 
            onInputChange={handleFormInputChange}
            cafeSize={cafeSize}
          />

          <CafeLocationInfo 
            formState={formState} 
            onSelectChange={handleFormSelectChange}
            availableCities={availableCities}
          />

          <PhotoUpload onPhotoChange={(photoUrl) => 
            handleFormSelectChange('photoUrl', photoUrl)
          } />

          <GPSCapture 
            coordinates={coordinates}
            onCaptureGPS={handleCaptureGPS}
            isCapturingLocation={isCapturingLocation}
            showLocationDialog={showLocationDialog}
            setShowLocationDialog={setShowLocationDialog}
          />
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-custom-red hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Add Cafe"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AddCafeForm;
