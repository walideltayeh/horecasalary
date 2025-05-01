
import { useState } from 'react';
import { useCafes } from '@/contexts/CafeContext';
import { useAuth } from '@/contexts/AuthContext';
import { CafeFormState } from '@/components/cafe/types/CafeFormTypes';
import { toast } from 'sonner';

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
      
      // Enhanced global events to ensure admins get updates
      window.dispatchEvent(new CustomEvent('horeca_data_updated', {
        detail: { 
          action: 'cafeCreated', 
          cafeId,
          forceRefresh: true
        }
      }));
      
      // Trigger data refresh through events instead of edge function
      try {
        // Dispatch event for same-tab communication
        window.dispatchEvent(new CustomEvent('global_data_refresh', {
          detail: { timestamp: Date.now() }
        }));
        
        // Update localStorage for cross-tab communication
        localStorage.setItem('cafe_data_updated', String(new Date().getTime()));
      } catch (err) {
        console.warn("Non-critical error refreshing data:", err);
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
