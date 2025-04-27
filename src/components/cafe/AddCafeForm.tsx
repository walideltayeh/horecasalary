
import React from 'react';
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

const AddCafeForm: React.FC = () => {
  const { user } = useAuth();
  const { addCafe } = useCafes();

  const {
    formState,
    isSubmitting,
    handleInputChange,
    handleSelectChange,
    handleSubmit,
    handleCaptureGPS,
    coordinates,
    getCafeSize
  } = useCafeForm(async (cafeData) => {
    // Prepare data for submission
    const completeData = {
      ...cafeData,
      createdBy: user?.id || 'unknown',
      status: 'Pending' as const
    };
    
    // Use the addCafe method from CafeContext
    await addCafe(completeData);
  });

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
            onInputChange={handleInputChange} 
          />

          <CafeCapacityInfo 
            formState={formState} 
            onInputChange={handleInputChange}
            cafeSize={cafeSize}
          />

          <CafeLocationInfo 
            formState={formState} 
            onSelectChange={handleSelectChange}
            availableCities={availableCities}
          />

          <PhotoUpload onPhotoChange={(photoUrl) => 
            handleSelectChange('photoUrl', photoUrl)
          } />

          <GPSCapture 
            coordinates={coordinates}
            onCaptureGPS={handleCaptureGPS}
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
