
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
    status: cafe.status
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
      console.log("Starting cafe edit submission for cafe ID:", cafe.id);
      
      // Validate the form
      const requiredFields = [
        { field: 'name', label: 'Cafe name' },
        { field: 'ownerName', label: 'Owner name' },
        { field: 'ownerNumber', label: 'Owner phone' },
        { field: 'governorate', label: 'Governorate' },
        { field: 'city', label: 'City' },
        { field: 'status', label: 'Cafe status' },
        { field: 'photoUrl', label: 'Cafe photo' }
      ];
      
      const missingFields = requiredFields
        .filter(({ field }) => {
          const value = formData[field as keyof typeof formData];
          return value === undefined || value === null || value === '';
        })
        .map(({ label }) => label);
        
      if (missingFields.length > 0) {
        console.error("Missing fields in edit form:", missingFields);
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }
      
      // Validate phone number format
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.ownerNumber.replace(/\D/g, ''))) {
        console.error("Invalid phone format in edit form");
        toast.error('Please enter a valid phone number (10-15 digits)');
        setIsSubmitting(false);
        return;
      }
      
      console.log("Submitting updated cafe data:", formData);
      
      // Submit the form
      const success = await updateCafe(cafe.id, formData);
      
      if (success) {
        console.log("Cafe updated successfully");
        
        // Force a refresh of all cafe data
        window.dispatchEvent(new CustomEvent('horeca_data_updated', { 
          detail: { action: 'cafeEdited', cafeId: cafe.id }
        }));
        
        onSave();
      } else {
        console.error("Update cafe returned false");
        toast.error("Failed to update cafe. Please try again.");
      }
    } catch (error: any) {
      console.error("Error updating cafe:", error);
      toast.error(`Failed to update cafe: ${error.message || "Unknown error"}`);
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
