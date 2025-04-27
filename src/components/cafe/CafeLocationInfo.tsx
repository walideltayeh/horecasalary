
import React, { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CafeFormProps } from './types/CafeFormTypes';
import { mexicoLocations } from '@/data/mexicoLocations';

export const CafeLocationInfo = ({ 
  formState, 
  onSelectChange,
  availableCities 
}: Pick<CafeFormProps, 'formState' | 'onSelectChange' | 'availableCities'>) => {
  const [cities, setCities] = useState<string[]>([]);

  // Update cities when governorate changes
  useEffect(() => {
    if (formState.governorate) {
      const locationData = mexicoLocations.find(
        location => location.governorate === formState.governorate
      );
      
      if (locationData) {
        setCities(locationData.cities);
        
        // If current city is not in the new cities list, clear it
        if (formState.city && !locationData.cities.includes(formState.city)) {
          onSelectChange('city', '');
        }
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [formState.governorate]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="governorate">Governorate</Label>
        <Select 
          value={formState.governorate} 
          onValueChange={(value) => onSelectChange('governorate', value)}
        >
          <SelectTrigger id="governorate" className="input-with-red-outline">
            <SelectValue placeholder="Select governorate" />
          </SelectTrigger>
          <SelectContent>
            {mexicoLocations.map((location) => (
              <SelectItem key={location.governorate} value={location.governorate}>
                {location.governorate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Select 
          value={formState.city} 
          onValueChange={(value) => onSelectChange('city', value)}
          disabled={cities.length === 0}
        >
          <SelectTrigger id="city" className="input-with-red-outline">
            <SelectValue placeholder={cities.length ? "Select city" : "Select governorate first"} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
