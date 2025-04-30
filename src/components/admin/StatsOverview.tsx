
import React, { useEffect, useState } from 'react';
import CafeStatsCard from './CafeStatsCard';
import { Cafe } from '@/types';

interface StatsOverviewProps {
  cafes: Cafe[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ cafes }) => {
  const [stats, setStats] = useState({
    totalCafes: 0,
    pendingCafes: 0, 
    visitedCafes: 0,
    contractedCafes: 0
  });
  
  // Update stats whenever cafes change
  useEffect(() => {
    const totalCafes = cafes.length;
    const pendingCafes = cafes.filter(cafe => cafe.status === 'Pending').length;
    // Count both Visited AND Contracted as visited for total visited count
    const visitedCafes = cafes.filter(cafe => 
      cafe.status === 'Visited' || cafe.status === 'Contracted').length;
    const contractedCafes = cafes.filter(cafe => cafe.status === 'Contracted').length;
    
    setStats({ totalCafes, pendingCafes, visitedCafes, contractedCafes });
  }, [cafes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CafeStatsCard title="Total Cafes" value={stats.totalCafes} />
      <CafeStatsCard title="Pending Cafes" value={stats.pendingCafes} />
      <CafeStatsCard title="Visited Cafes" value={stats.visitedCafes} />
      <CafeStatsCard title="Contracted Cafes" value={stats.contractedCafes} />
    </div>
  );
};

export default StatsOverview;
