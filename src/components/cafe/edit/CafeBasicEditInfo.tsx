
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CafeBasicEditInfoProps {
  formData: {
    name: string;
    ownerName: string;
    ownerNumber: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CafeBasicEditInfo: React.FC<CafeBasicEditInfoProps> = ({ 
  formData, 
  handleInputChange 
}) => {
  return (
    <>
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
    </>
  );
};
