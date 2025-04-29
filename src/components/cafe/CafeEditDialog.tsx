
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cafe } from '@/types';
import { useCafes } from '@/contexts/CafeContext';
import { toast } from 'sonner';
import { getGovernorates, getCitiesForGovernorate } from '@/utils/locationUtils';
import { PhotoUpload } from './PhotoUpload';

interface CafeEditDialogProps {
  cafe: Cafe;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CafeEditDialog: React.FC<CafeEditDialogProps> = ({ cafe, isOpen, onClose, onSave }) => {
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
  
  // Get the list of all governorates
  const governorates = getGovernorates();
  
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
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Cafe</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Cafe Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Cafe name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              placeholder="Owner name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="ownerNumber">Owner Phone</Label>
            <Input
              id="ownerNumber"
              name="ownerNumber"
              value={formData.ownerNumber}
              onChange={handleInputChange}
              placeholder="Owner phone number"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="numberOfHookahs">Number of Hookahs</Label>
              <Input
                id="numberOfHookahs"
                name="numberOfHookahs"
                type="number"
                value={formData.numberOfHookahs}
                onChange={handleInputChange}
                min={0}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="numberOfTables">Number of Tables</Label>
              <Input
                id="numberOfTables"
                name="numberOfTables"
                type="number"
                value={formData.numberOfTables}
                onChange={handleInputChange}
                min={0}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="governorate">Governorate</Label>
            <Select
              value={formData.governorate}
              onValueChange={(value) => handleSelectChange('governorate', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select governorate" />
              </SelectTrigger>
              <SelectContent>
                {governorates.map((gov) => (
                  <SelectItem key={gov} value={gov}>
                    {gov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Select
              value={formData.city}
              onValueChange={(value) => handleSelectChange('city', value)}
              disabled={!formData.governorate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <PhotoUpload 
              onPhotoChange={(url) => handleSelectChange('photoUrl', url)}
              initialUrl={formData.photoUrl} 
            />
          </div>

          <div className="text-sm text-gray-500 mt-2">
            <p>Note: GPS location cannot be changed after cafe creation.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CafeEditDialog;
