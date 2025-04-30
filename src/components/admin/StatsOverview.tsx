
import React, { useEffect, useState } from 'react';
import CafeStatsCard from './CafeStatsCard';
import { Cafe } from '@/types';
import { getVisitCounts, getContractCounts } from '@/utils/cafeUtils';
import { useData } from '@/contexts/DataContext';

interface StatsOverviewProps {
  cafes: Cafe[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ cafes }) => {
  const { kpiSettings } = useData();
  const [stats, setStats] = useState({
    totalCafes: 0,
    pendingCafes: 0, 
    visitedCafes: 0,
    contractedCafes: 0
  });
  
  const [visitDetails, setVisitDetails] = useState({
    small: 0,
    medium: 0,
    large: 0,
    total: 0
  });
  
  const [contractDetails, setContractDetails] = useState({
    small: 0,
    medium: 0,
    large: 0,
    total: 0
  });
  
  // Update stats whenever cafes change
  useEffect(() => {
    const totalCafes = cafes.length;
    const pendingCafes = cafes.filter(cafe => cafe.status === 'Pending').length;
    // Count both Visited AND Contracted as visited for total visited count
    const visitedCafes = cafes.filter(cafe => 
      cafe.status === 'Visited' || cafe.status === 'Contracted').length;
    const contractedCafes = cafes.filter(cafe => cafe.status === 'Contracted').length;
    
    // Calculate detailed visit and contract counts
    const visitCounts = getVisitCounts(cafes);
    const contractCounts = getContractCounts(cafes);
    
    setStats({ totalCafes, pendingCafes, visitedCafes, contractedCafes });
    setVisitDetails(visitCounts);
    setContractDetails(contractCounts);
    
    // Dispatch an event to notify other components that stats have been updated
    window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
      detail: { 
        totalCafes, 
        pendingCafes, 
        visitedCafes, 
        contractedCafes,
        visitCounts,
        contractCounts
      }
    }));
  }, [cafes]);

  // Format the detailed counts with targets
  const formatVisitCountDetails = () => {
    if (!kpiSettings) return 'Loading...';
    
    return [
      `Large: ${visitDetails.large}/${kpiSettings.target_visits_large}`,
      `Medium: ${visitDetails.medium}/${kpiSettings.target_visits_medium}`,
      `Small: ${visitDetails.small}/${kpiSettings.target_visits_small}`
    ].join(' • ');
  };
  
  const formatContractCountDetails = () => {
    if (!kpiSettings) return 'Loading...';
    
    return [
      `Large: ${contractDetails.large}/${kpiSettings.target_contracts_large}`,
      `Medium: ${contractDetails.medium}/${kpiSettings.target_contracts_medium}`,
      `Small: ${contractDetails.small}/${kpiSettings.target_contracts_small}`
    ].join(' • ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CafeStatsCard title="Total Cafes" value={stats.totalCafes} />
      <CafeStatsCard title="Pending Cafes" value={stats.pendingCafes} />
      <CafeStatsCard 
        title="Visited Cafes" 
        value={stats.visitedCafes} 
        subtext={formatVisitCountDetails()} 
      />
      <CafeStatsCard 
        title="Contracted Cafes" 
        value={stats.contractedCafes} 
        subtext={formatContractCountDetails()} 
      />
    </div>
  );
};

export default StatsOverview;
