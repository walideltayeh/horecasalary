
import React from 'react';
import { CafeSize } from '@/types';

interface CafeSizeBadgeProps {
  cafeSize: CafeSize;
}

const CafeSizeBadge: React.FC<CafeSizeBadgeProps> = ({ cafeSize }) => {
  return (
    <span className={cafeSize === 'In Negotiation' ? 'text-orange-500' : 
                    cafeSize === 'Small' ? 'text-blue-500' : 
                    cafeSize === 'Medium' ? 'text-green-500' : 
                    'text-purple-500'}>
      {cafeSize}
    </span>
  );
};

export default CafeSizeBadge;
