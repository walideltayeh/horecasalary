
import React from 'react';

interface CafeStatusBadgeProps {
  status: 'Pending' | 'Visited' | 'Contracted';
}

const CafeStatusBadge: React.FC<CafeStatusBadgeProps> = ({ status }) => {
  return (
    <span className={status === 'Contracted' ? 'text-green-500' : 
                    status === 'Visited' ? 'text-blue-500' : 
                    'text-gray-500'}>
      {status}
    </span>
  );
};

export default CafeStatusBadge;
