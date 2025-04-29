
import { useState } from 'react';
import { useCafes } from '@/contexts/CafeContext';
import { useAuth } from '@/contexts/AuthContext';
import { CafeFormState } from '@/components/cafe/types/CafeFormTypes';

interface UseSubmitCafeProps {
  onPreSubmit?: (cafeData: CafeFormState & { latitude: number, longitude: number }) => Promise<boolean>;
  surveyCompleted: boolean;
}

export const useSubmitCafe = ({ onPreSubmit, surveyCompleted }: UseSubmitCafeProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { addCafe } = useCafes();

  const handleSubmit = async (
    cafeData: CafeFormState, 
    coordinates: { latitude: number, longitude: number }
  ) => {
    try {
      setIsSubmitting(true);
      console.log("Processing cafe submission with data:", cafeData);

      if (cafeData.numberOfHookahs >= 1 && !surveyCompleted) {
        console.log("Cafe has hookahs but survey not completed, checking with onPreSubmit...");
      }
    
      const completeData = {
        ...cafeData,
        ...coordinates,
        createdBy: user?.id || 'unknown',
        // Use the selected status from the form instead of hardcoding 'Pending'
        status: cafeData.status
      };
      
      if (onPreSubmit) {
        const canSubmit = await onPreSubmit(completeData);
        if (!canSubmit) {
          return null;
        }
      }
      
      return await addCafe(completeData);
    } catch (error: any) {
      console.error('Error submitting cafe:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit
  };
};
