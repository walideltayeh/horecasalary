
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface CafeStatusBadgeProps {
  status: 'Pending' | 'Visited' | 'Contracted';
}

const CafeStatusBadge: React.FC<CafeStatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
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
  
  return (
    <Badge variant="outline" className={`font-medium ${getBadgeStyle()}`}>
      {status}
    </Badge>
  );
};

export default CafeStatusBadge;
