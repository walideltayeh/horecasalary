
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmitCafe } from '@/hooks/useSubmitCafe';
import { CafeFormState } from '../types/CafeFormTypes';
import { toast } from 'sonner';

interface CafeSubmitHandlerProps {
  formState: CafeFormState;
  coordinates: {latitude: number | null; longitude: number | null};
  surveyCompleted: boolean;
  onPreSubmit?: (cafeData: CafeFormState & { latitude: number, longitude: number }) => Promise<boolean>;
  onShowSurvey: () => void;
  children: React.ReactNode;
}

export const CafeSubmitHandler: React.FC<CafeSubmitHandlerProps> = ({
  formState,
  coordinates,
  surveyCompleted,
  onPreSubmit,
  onShowSurvey,
  children
}) => {
  const { user } = useAuth();
  const { isSubmitting, handleSubmit: submitCafe } = useSubmitCafe({
    onPreSubmit,
    surveyCompleted
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formState);
    
    // First, validate that all fields are filled
    const requiredFields = [
      { field: 'name', label: 'Cafe name' },
      { field: 'ownerName', label: 'Owner name' },
      { field: 'ownerNumber', label: 'Owner phone' },
      { field: 'governorate', label: 'Governorate' },
      { field: 'city', label: 'City' },
      { field: 'photoUrl', label: 'Cafe photo' },
      { field: 'status', label: 'Cafe status' },
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
      console.error("Missing fields:", missingFields);
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(formState.ownerNumber.replace(/\D/g, ''))) {
      console.error("Invalid phone number format");
      toast.error('Please enter a valid phone number (10-15 digits)');
      return;
    }
    
    // Validate GPS coordinates
    if (!coordinates.latitude || !coordinates.longitude) {
      console.error("Missing GPS coordinates");
      toast.error('Please capture the GPS location');
      return;
    }
    
    if (formState.numberOfHookahs >= 1 && !surveyCompleted) {
      console.log("Survey needed but not completed");
      onShowSurvey();
      toast.info("Please complete the brand survey before submitting");
      return;
    }
    
    try {
      console.log("Attempting submission with coordinates:", coordinates);
      const result = await submitCafe(formState, coordinates);
      if (result) {
        console.log("Cafe submitted successfully with ID:", result);
        toast.success("Cafe added successfully!");
      } else {
        console.error("Submission returned null result");
        toast.error("Failed to save cafe. Please try again.");
      }
    } catch (error: any) {
      console.error("Error in form submit:", error);
      toast.error(`Submission failed: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <form id="cafe-form" onSubmit={handleSubmit}>
      {children}
    </form>
  );
};
