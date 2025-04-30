
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CafeStatusSelectProps {
  selectedStatus: 'Pending' | 'Visited' | 'Contracted';
  onSelectChange: (name: string, value: string) => void;
  numberOfHookahs?: number;
}

const CafeStatusSelect: React.FC<CafeStatusSelectProps> = ({ 
  selectedStatus, 
  onSelectChange,
  numberOfHookahs = 1 
}) => {
  // Check if cafe is in negotiation (0 hookahs)
  const isInNegotiation = numberOfHookahs === 0;
  
  return (
    <Select 
      value={selectedStatus} 
      onValueChange={(value) => {
        // Prevent setting Contracted status if in negotiation
        if (value === 'Contracted' && isInNegotiation) {
          return;
        }
        onSelectChange('status', value);
      }}
    >
      <SelectTrigger className="w-full input-with-red-outline">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Pending">Pending</SelectItem>
        <SelectItem value="Visited">Visited</SelectItem>
        
        {/* Wrap the Contracted option in tooltip if disabled */}
        {isInNegotiation ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SelectItem 
                    value="Contracted" 
                    disabled={true}
                    className="text-gray-400 opacity-60 cursor-not-allowed"
                  >
                    Contracted
                  </SelectItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cafes in negotiation (0 hookahs) cannot be marked as contracted</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <SelectItem value="Contracted">Contracted</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default CafeStatusSelect;
