
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cafe } from '@/types';
import StatsOverview from './StatsOverview';

interface CafeStatsCardProps {
  title?: string;
  value?: number;
  subtext?: string;
}

// Original CafeStatsCard for displaying a single stat
const CafeStatsCard: React.FC<CafeStatsCardProps> = ({ title, value, subtext }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Export a separate component for the Admin page that takes cafes and loadingCafes
export const AdminCafeStats: React.FC<{ cafes: Cafe[]; loadingCafes: boolean }> = ({ 
  cafes, 
  loadingCafes 
}) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-4">Cafe Statistics</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        {loadingCafes ? (
          <div className="text-center py-4">Loading stats...</div>
        ) : (
          <StatsOverview cafes={cafes} />
        )}
      </div>
    </div>
  );
};

export default CafeStatsCard;
