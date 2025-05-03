import { useState, useCallback } from 'react';
import { CafeFormState } from '@/components/cafe/types/CafeFormTypes';
import { useGPSLocation } from './useGPSLocation';
import { toast } from 'sonner';

export const useCafeForm = (onSubmit?: (formData: CafeFormState & { latitude: number, longitude: number }) => Promise<string | null | void>) => {
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

  // Add reset function to clear the form
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

  const validateForm = useCallback(() => {
    // Validate that all required fields are filled
    const {
      name, 
      ownerName, 
      ownerNumber,
      numberOfHookahs,
      numberOfTables, 
      governorate, 
      city, 
      photoUrl
    } = formState;

    // Check all fields are filled
    const requiredFields = [
      { value: name, message: 'Cafe name is required' },
      { value: ownerName, message: 'Owner name is required' },
      { value: ownerNumber, message: 'Owner number is required' },
      { value: photoUrl, message: 'Cafe photo is required' },
      { value: governorate, message: 'Governorate is required' },
      { value: city, message: 'City is required' }
    ];

    // Add numeric field validations
    if (numberOfHookahs === undefined || numberOfHookahs < 0) {
      requiredFields.push({ value: '', message: 'Number of hookahs must be 0 or greater' });
    }
    
    if (numberOfTables === undefined || numberOfTables < 0) {
      requiredFields.push({ value: '', message: 'Number of tables must be 0 or greater' });
    }

    // Fix the type comparison issue by being more explicit with the filtering
    const missingFields = requiredFields
      .filter(field => {
        // String values: check if they're empty strings
        if (typeof field.value === 'string') {
          return field.value.trim() === '';
        }
        // Number values: this would never enter this filter since they're validated above
        // but added for type completeness
        if (typeof field.value === 'number') {
          return false; // Numbers are validated separately above
        }
        // In case of any other type, consider it as missing
        return true;
      })
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

    // Only proceed with submission if onSubmit callback was provided
    if (onSubmit) {
      try {
        setIsSubmitting(true);
        console.log("Form validation successful, proceeding with submission");
        
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
        
        console.log("Submitting cafe data:", submissionData);
        await onSubmit(submissionData);
        
        // Reset form after successful submission
        resetForm();
      } catch (error: any) {
        console.error('Error submitting cafe:', error);
        toast.error(error.message || 'Failed to submit cafe');
      } finally {
        setIsSubmitting(false);
      }
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
    resetForm,
    getCafeSize: (numberOfHookahs: number) => {
      if (numberOfHookahs === 0) return 'In Negotiation';
      if (numberOfHookahs >= 1 && numberOfHookahs <= 3) return 'Small';
      if (numberOfHookahs >= 4 && numberOfHookahs <= 7) return 'Medium';
      return 'Large';
    }
  };
};
