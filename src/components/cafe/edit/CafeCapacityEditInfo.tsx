
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CafeCapacityEditInfoProps {
  formData: {
    numberOfHookahs: number;
    numberOfTables: number;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CafeCapacityEditInfo: React.FC<CafeCapacityEditInfoProps> = ({ 
  formData, 
  handleInputChange 
}) => {
  return (
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
  );
};
