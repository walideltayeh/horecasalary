
import { useState } from 'react';
import { useCafes } from '@/contexts/CafeContext';
import { useAuth } from '@/contexts/AuthContext';
import { CafeFormState } from '@/components/cafe/types/CafeFormTypes';
import { toast } from 'sonner';

interface UseSubmitCafeProps {
  onPreSubmit?: (cafeData: CafeFormState & { latitude: number, longitude: number }) => Promise<boolean>;
  surveyCompleted: boolean;
  onSuccess?: () => void; // Add callback for successful submission
}

export const useSubmitCafe = ({ onPreSubmit, surveyCompleted, onSuccess }: UseSubmitCafeProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { addCafe } = useCafes();

  const handleSubmit = async (
    cafeData: CafeFormState, 
    coordinates: { latitude: number | null, longitude: number | null }
  ) => {
    try {
      if (!coordinates.latitude || !coordinates.longitude) {
        throw new Error("GPS coordinates are required");
      }

      setIsSubmitting(true);
      console.log("Processing cafe submission with data:", cafeData);

      if (cafeData.numberOfHookahs >= 1 && !surveyCompleted) {
        console.log("Cafe has hookahs but survey not completed");
        return null;
      }
    
      const completeData = {
        ...cafeData,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        createdBy: user?.id || 'unknown'
      };
      
      if (onPreSubmit) {
        const canSubmit = await onPreSubmit(completeData);
        if (!canSubmit) {
          return null;
        }
      }
      
      const cafeId = await addCafe(completeData);
      console.log("Cafe added with ID:", cafeId);
      
      // Only trigger a single refresh event
      window.dispatchEvent(new CustomEvent('horeca_data_updated', {
        detail: { action: 'cafeAdded', cafeId }
      }));
      
      // Call the onSuccess callback if provided
      if (onSuccess && cafeId) {
        onSuccess();
      }
      
      return cafeId;
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
