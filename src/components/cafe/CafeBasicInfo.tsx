
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CafeFormProps } from './types/CafeFormTypes';

export const CafeBasicInfo = ({ 
  formState, 
  onInputChange 
}: Pick<CafeFormProps, 'formState' | 'onInputChange'>) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name of Cafe <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="name" 
          name="name"
          value={formState.name}
          onChange={onInputChange}
          placeholder="Enter cafe name" 
          className="input-with-red-outline"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ownerName">
          Owner's Name <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="ownerName" 
          name="ownerName"
          value={formState.ownerName}
          onChange={onInputChange}
          placeholder="Enter owner's name" 
          className="input-with-red-outline"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ownerNumber">
          Owner's Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="ownerNumber" 
          name="ownerNumber"
          value={formState.ownerNumber}
          onChange={onInputChange}
          placeholder="Enter owner's phone number" 
          className="input-with-red-outline"
          required
        />
      </div>
    </div>
  );
};
