
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGovernorates } from '@/utils/locationUtils';

interface CafeLocationEditInfoProps {
  formData: {
    governorate: string;
    city: string;
  };
  availableCities: string[];
  handleSelectChange: (key: string, value: string) => void;
}

export const CafeLocationEditInfo: React.FC<CafeLocationEditInfoProps> = ({
  formData,
  availableCities,
  handleSelectChange
}) => {
  const governorates = getGovernorates();

  return (
    <>
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
    </>
  );
};
