
import { useState, useEffect } from 'react';
import { Cafe } from '@/types';
import { useCafes } from '@/contexts/CafeContext';
import { toast } from 'sonner';
import { getCitiesForGovernorate } from '@/utils/locationUtils';

export const useEditCafeDialog = (
  cafe: Cafe,
  onClose: () => void,
  onSave: () => void
) => {
  const { updateCafe } = useCafes();
  const [formData, setFormData] = useState({
    name: cafe.name,
    ownerName: cafe.ownerName,
    ownerNumber: cafe.ownerNumber,
    numberOfHookahs: cafe.numberOfHookahs,
    numberOfTables: cafe.numberOfTables,
    governorate: cafe.governorate,
    city: cafe.city,
    photoUrl: cafe.photoUrl || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Update available cities when governorate changes
  useEffect(() => {
    if (formData.governorate) {
      const cities = getCitiesForGovernorate(formData.governorate);
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [formData.governorate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    
    // Convert number inputs from string to number
    if (name === 'numberOfHookahs' || name === 'numberOfTables') {
      parsedValue = parseInt(value);
      if (isNaN(parsedValue)) parsedValue = 0;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };
  
  const handleSelectChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    
    // Reset city when governorate changes
    if (key === 'governorate') {
      setFormData((prev) => ({
        ...prev,
        city: '',
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate the form
      if (!formData.name.trim()) {
        toast.error("Cafe name is required");
        return;
      }
      
      if (!formData.ownerName.trim()) {
        toast.error("Owner name is required");
        return;
      }
      
      if (!formData.ownerNumber.trim()) {
        toast.error("Owner number is required");
        return;
      }
      
      if (!formData.governorate) {
        toast.error("Governorate is required");
        return;
      }
      
      if (!formData.city) {
        toast.error("City is required");
        return;
      }
      
      // Submit the form
      const success = await updateCafe(cafe.id, formData);
      
      if (success) {
        toast.success("Cafe updated successfully");
        onSave();
      }
    } catch (error) {
      console.error("Error updating cafe:", error);
      toast.error("Failed to update cafe");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    availableCities,
    handleInputChange,
    handleSelectChange,
    handleSubmit
  };
};
