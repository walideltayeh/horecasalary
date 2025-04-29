
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface CafeStatusBadgeProps {
  status: 'Pending' | 'Visited' | 'Contracted';
}

const CafeStatusBadge: React.FC<CafeStatusBadgeProps> = ({ status }) => {
  let variant: "outline" | "default" | "secondary" | "destructive" = "outline";
  
  // Determine badge variant based on status
  switch (status) {
    case 'Contracted':
      variant = "default"; // Green
      break;
    case 'Visited':
      variant = "secondary"; // Blue
      break;
    case 'Pending':
    default:
      variant = "outline"; // Gray
      break;
  }
  
  return (
    <Badge variant={variant} className="font-medium">
      {status}
    </Badge>
  );
};

export default CafeStatusBadge;
