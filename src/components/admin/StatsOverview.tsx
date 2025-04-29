
import React from 'react';
import CafeStatsCard from './CafeStatsCard';
import { Cafe } from '@/types';

interface StatsOverviewProps {
  cafes: Cafe[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ cafes }) => {
  const totalCafes = cafes.length;
  const pendingCafes = cafes.filter(cafe => cafe.status === 'Pending').length;
  const visitedCafes = cafes.filter(cafe => cafe.status === 'Visited').length;
  const contractedCafes = cafes.filter(cafe => cafe.status === 'Contracted').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CafeStatsCard title="Total Cafes" value={totalCafes} />
      <CafeStatsCard title="Pending Cafes" value={pendingCafes} />
      <CafeStatsCard title="Visited Cafes" value={visitedCafes} />
      <CafeStatsCard title="Contracted Cafes" value={contractedCafes} />
    </div>
  );
};

export default StatsOverview;
