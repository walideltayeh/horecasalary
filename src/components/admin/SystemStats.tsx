
import React from 'react';
import { Card } from "@/components/ui/card";
import { Cafe } from '@/types';

interface SystemStatsProps {
  cafes: Cafe[];
}

const SystemStats: React.FC<SystemStatsProps> = ({ cafes }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-500">Total Cafes</div>
          <div className="text-2xl font-bold mt-1">{cafes.length}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-500">Visited Cafes</div>
          <div className="text-2xl font-bold mt-1">
            {cafes.filter(c => c.status === 'Visited' || c.status === 'Contracted').length}
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-500">Contracted Cafes</div>
          <div className="text-2xl font-bold mt-1">
            {cafes.filter(c => c.status === 'Contracted').length}
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>HoReCa Salary App - Admin Panel</p>
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default SystemStats;
