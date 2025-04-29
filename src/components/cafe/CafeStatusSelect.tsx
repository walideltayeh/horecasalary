
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CafeStatusSelectProps {
  selectedStatus: 'Pending' | 'Visited' | 'Contracted';
  onSelectChange: (name: string, value: string) => void;
}

const CafeStatusSelect: React.FC<CafeStatusSelectProps> = ({ selectedStatus, onSelectChange }) => {
  return (
    <div className="space-y-2">
      <Label className="block">
        Cafe Status <span className="text-red-500">*</span>
      </Label>
      <Select 
        value={selectedStatus} 
        onValueChange={(value) => onSelectChange('status', value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Visited">Visited</SelectItem>
          <SelectItem value="Contracted">Contracted</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CafeStatusSelect;
