import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { mexicoLocations } from '@/data/mexicoLocations';
import { toast } from 'sonner';
import { PhotoUpload } from './PhotoUpload';
import { GPSCapture } from './GPSCapture';
import { useGPSLocation } from '@/hooks/useGPSLocation';
import { CafeBasicInfo } from './CafeBasicInfo';
import { CafeCapacityInfo } from './CafeCapacityInfo';
import { CafeLocationInfo } from './CafeLocationInfo';
import { CafeFormState } from './types/CafeFormTypes';

interface AddCafeFormProps {
  onCafeAdded: (cafeId: string, cafeData: any) => void;
}

const AddCafeForm: React.FC<AddCafeFormProps> = ({ onCafeAdded }) => {
  const { user } = useAuth();
  const { 
    coordinates, 
    isCapturingLocation, 
    showLocationDialog, 
    setShowLocationDialog, 
    handleCaptureGPS 
  } = useGPSLocation();
  
  const [formState, setFormState] = useState<CafeFormState>({
    name: '',
    ownerName: '',
    ownerNumber: '',
    numberOfHookahs: 0,
    numberOfTables: 0,
    status: 'Pending',
    photoUrl: '',
    governorate: '',
    city: '',
  });
  
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (formState.governorate) {
      const selectedLocation = mexicoLocations.find(
        location => location.governorate === formState.governorate
      );
      
      if (selectedLocation) {
        setAvailableCities(selectedLocation.cities);
        setFormState(prev => ({ ...prev, city: '' }));
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [formState.governorate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormState(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (photoUrl: string) => {
    setFormState(prev => ({ ...prev, photoUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      !formState.name || 
      !formState.ownerName || 
      !formState.ownerNumber || 
      !formState.governorate || 
      !formState.city ||
      formState.numberOfHookahs === undefined ||
      formState.numberOfTables === undefined ||
      !coordinates.latitude ||
      !coordinates.longitude
    ) {
      toast.error("Please fill in all required fields and capture GPS location");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const cafeData = {
        name: formState.name,
        ownerName: formState.ownerName,
        ownerNumber: formState.ownerNumber,
        numberOfHookahs: formState.numberOfHookahs,
        numberOfTables: formState.numberOfTables,
        status: formState.status as 'Pending' | 'Visited' | 'Contracted',
        photoUrl: formState.photoUrl,
        governorate: formState.governorate,
        city: formState.city,
        createdBy: user?.id || 'unknown',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
      
      const tempId = `temp-${Date.now()}`;
      console.log("Submitting cafe with data:", cafeData);
      
      onCafeAdded(tempId, cafeData);
      resetForm();
    } catch (error: any) {
      console.error('Error in form submission:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormState({
      name: '',
      ownerName: '',
      ownerNumber: '',
      numberOfHookahs: 0,
      numberOfTables: 0,
      status: 'Pending',
      photoUrl: '',
      governorate: '',
      city: '',
    });
  };

  const shouldShowBrandSurvey = formState.numberOfHookahs > 0;

  const getCafeSize = (numberOfHookahs: number): string => {
    if (numberOfHookahs === 0) return 'In Negotiation';
    if (numberOfHookahs >= 1 && numberOfHookahs <= 3) return 'Small';
    if (numberOfHookahs >= 4 && numberOfHookahs <= 7) return 'Medium';
    return 'Large';
  };

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

          <PhotoUpload onPhotoChange={handlePhotoChange} />

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
            disabled={isSubmitting || !shouldShowBrandSurvey}
          >
            {isSubmitting ? "Processing..." : "Continue to Brand Survey"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AddCafeForm;
