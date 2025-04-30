
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CafeStatusSelectProps {
  selectedStatus: 'Pending' | 'Visited' | 'Contracted';
  onSelectChange: (name: string, value: string) => void;
}

const CafeStatusSelect: React.FC<CafeStatusSelectProps> = ({ selectedStatus, onSelectChange }) => {
  return (
    <Select 
      value={selectedStatus} 
      onValueChange={(value) => onSelectChange('status', value)}
    >
      <SelectTrigger className="w-full input-with-red-outline">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Pending">Pending</SelectItem>
        <SelectItem value="Visited">Visited</SelectItem>
        <SelectItem value="Contracted">Contracted</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default CafeStatusSelect;
