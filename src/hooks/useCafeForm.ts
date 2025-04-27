
import { useState, useCallback } from 'react';
import { CafeFormState } from '@/components/cafe/types/CafeFormTypes';
import { useGPSLocation } from './useGPSLocation';
import { toast } from 'sonner';

export const useCafeForm = (onSubmit: (formData: CafeFormState & { latitude: number, longitude: number }) => Promise<string | null | void>) => {
  const { 
    coordinates, 
    handleCaptureGPS, 
    isCapturingLocation, 
    showLocationDialog, 
    setShowLocationDialog 
  } = useGPSLocation();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const validateForm = useCallback(() => {
    const {
      name, 
      ownerName, 
      ownerNumber, 
      governorate, 
      city, 
      photoUrl
    } = formState;

    const requiredFields = [
      { value: name, message: 'Cafe name is required' },
      { value: ownerName, message: 'Owner name is required' },
      { value: ownerNumber, message: 'Owner number is required' },
      { value: governorate, message: 'Governorate is required' },
      { value: city, message: 'City is required' },
      { value: photoUrl, message: 'Cafe photo is required' }
    ];

    const missingFields = requiredFields
      .filter(field => !field.value)
      .map(field => field.message);

    const hasGPSCoordinates = coordinates.latitude && coordinates.longitude;

    if (missingFields.length > 0) {
      toast.error(missingFields.join(', '));
      return false;
    }

    if (!hasGPSCoordinates) {
      toast.error('GPS location is required');
      return false;
    }

    return true;
  }, [formState, coordinates]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Add coordinates to the form state
      if (!coordinates.latitude || !coordinates.longitude) {
        toast.error('GPS location is required');
        return;
      }
      
      const submissionData = {
        ...formState,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
      
      await onSubmit(submissionData);
      
      // Reset form after successful submission
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
    } catch (error: any) {
      console.error('Error submitting cafe:', error);
      toast.error(error.message || 'Failed to submit cafe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formState,
    isSubmitting,
    handleInputChange,
    handleSelectChange,
    handleSubmit,
    handleCaptureGPS,
    coordinates,
    isCapturingLocation,
    showLocationDialog,
    setShowLocationDialog,
    getCafeSize: (numberOfHookahs: number) => {
      if (numberOfHookahs === 0) return 'In Negotiation';
      if (numberOfHookahs >= 1 && numberOfHookahs <= 3) return 'Small';
      if (numberOfHookahs >= 4 && numberOfHookahs <= 7) return 'Medium';
      return 'Large';
    }
  };
};
