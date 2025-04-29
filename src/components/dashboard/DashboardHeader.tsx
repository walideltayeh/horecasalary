
import React from 'react';

interface DashboardHeaderProps {
  isAdmin: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isAdmin }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600">
        {isAdmin 
          ? "Monitor team performance and metrics" 
          : "Monitor your performance and salary metrics"
        }
      </p>
    </div>
  );
};

export default DashboardHeader;
