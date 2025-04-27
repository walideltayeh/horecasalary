
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CafeFormProps } from './types/CafeFormTypes';

export const CafeCapacityInfo = ({ 
  formState, 
  onInputChange,
  cafeSize 
}: Pick<CafeFormProps, 'formState' | 'onInputChange' | 'cafeSize'>) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="numberOfHookahs">Number of Hookahs</Label>
        <Input 
          id="numberOfHookahs" 
          name="numberOfHookahs"
          type="number"
          min="0"
          value={formState.numberOfHookahs}
          onChange={onInputChange}
          className="input-with-red-outline"
        />
        <div className="mt-2">
          <div>Current Size: <span className="cafe-size-value">{cafeSize}</span></div>
          <div className="cafe-size-legend">
            1-3 hookahs: Small | 4-7 hookahs: Medium | 7+ hookahs: Large | 0 hookahs: In Negotiation
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="numberOfTables">Number of Tables</Label>
        <Input 
          id="numberOfTables" 
          name="numberOfTables"
          type="number"
          min="0"
          value={formState.numberOfTables}
          onChange={onInputChange}
          className="input-with-red-outline"
        />
      </div>
    </div>
  );
};
