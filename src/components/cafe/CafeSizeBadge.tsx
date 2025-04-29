
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CafeSize } from '@/types';

interface CafeSizeBadgeProps {
  cafeSize: CafeSize;
}

const CafeSizeBadge: React.FC<CafeSizeBadgeProps> = ({ cafeSize }) => {
  let variant: "outline" | "default" | "secondary" | "destructive" = "outline";
  
  // Determine badge variant based on cafe size
  switch (cafeSize) {
    case 'Large':
      variant = "default"; // Green
      break;
    case 'Medium':
      variant = "secondary"; // Blue
      break;
    case 'Small':
      variant = "outline"; // Gray with border
      break;
    case 'In Negotiation':
      // Orange - using custom styling
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-500">
          {cafeSize}
        </Badge>
      );
    default:
      variant = "outline";
      break;
  }
  
  return (
    <Badge variant={variant}>
      {cafeSize}
    </Badge>
  );
};

export default CafeSizeBadge;
