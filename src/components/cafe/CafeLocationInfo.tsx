
import React, { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CafeFormProps } from './types/CafeFormTypes';
import { getGovernorates, getCitiesForGovernorate } from '@/utils/locationUtils';
import { useLanguage } from '@/contexts/LanguageContext';

export const CafeLocationInfo = ({ 
  formState, 
  onSelectChange,
  availableCities 
}: Pick<CafeFormProps, 'formState' | 'onSelectChange' | 'availableCities'>) => {
  const [cities, setCities] = useState<string[]>([]);
  const governorates = getGovernorates();
  const { t } = useLanguage();

  // Update cities when governorate changes
  useEffect(() => {
    if (formState.governorate) {
      const locationCities = getCitiesForGovernorate(formState.governorate);
      setCities(locationCities);
      
      // If current city is not in the new cities list, clear it
      if (formState.city && !locationCities.includes(formState.city)) {
        onSelectChange('city', '');
      }
    } else {
      setCities([]);
    }
  }, [formState.governorate]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="governorate">
          {t('cafe.form.governorate')} <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={formState.governorate} 
          onValueChange={(value) => onSelectChange('governorate', value)}
          required
        >
          <SelectTrigger id="governorate" className="input-with-red-outline">
            <SelectValue placeholder={t('cafe.form.select.governorate')} />
          </SelectTrigger>
          <SelectContent>
            {governorates.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="city">
          {t('cafe.form.city')} <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={formState.city} 
          onValueChange={(value) => onSelectChange('city', value)}
          disabled={cities.length === 0}
          required
        >
          <SelectTrigger id="city" className="input-with-red-outline">
            <SelectValue placeholder={cities.length ? t('cafe.form.select.city') : t('cafe.form.select.governorate.first')} />
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
