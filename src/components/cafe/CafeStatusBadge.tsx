import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CafeStatusBadgeProps {
  status: 'Pending' | 'Visited' | 'Contracted';
  numberOfHookahs?: number;
}

const CafeStatusBadge: React.FC<CafeStatusBadgeProps> = ({ status, numberOfHookahs = 1 }) => {
  // Check if cafe is in negotiation (0 hookahs)
  const isInNegotiation = numberOfHookahs === 0;
  
  // Disabled state should be shown if trying to display Contracted for a cafe with 0 hookahs
  const isDisabled = isInNegotiation && status === 'Contracted';
  
  const getBadgeStyle = () => {
    if (isDisabled) {
      // For "Contracted" badge when cafe is in negotiation
      return "bg-gray-100 text-gray-400 opacity-60";
    }
    
    switch (status) {
      case 'Contracted':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'Visited':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'Pending':
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const badgeContent = (
    <Badge variant="outline" className={`font-medium ${getBadgeStyle()}`}>
      {status}
    </Badge>
  );
  
  // If disabled, wrap in tooltip to explain why
  if (isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>Cafes in negotiation (0 hookahs) cannot be marked as contracted</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Otherwise just return the badge
  return badgeContent;
};

export default CafeStatusBadge;
