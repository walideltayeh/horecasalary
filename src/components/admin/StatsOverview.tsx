
import React, { useEffect, useState } from 'react';
import CafeStatsCard from './CafeStatsCard';
import { Cafe } from '@/types';
import { getVisitCounts, getContractCounts, getCafeSize } from '@/utils/cafeUtils';
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
    inNegotiation: 0,
    total: 0
  });
  
  const [contractDetails, setContractDetails] = useState({
    small: 0,
    medium: 0,
    large: 0,
    total: 0
  });
  
  // Update stats whenever cafes change - URGENT FIX for display issues
  useEffect(() => {
    console.log("StatsOverview - URGENT RECALCULATION with cafes:", cafes.length);
    console.log("Raw cafes data:", cafes);
    
    // Force immediate calculation even with empty array to show proper zero states
    const totalCafes = cafes.length;
    const pendingCafes = cafes.filter(cafe => cafe.status === 'Pending').length;
    // Count both Visited AND Contracted as visited for total visited count
    const visitedCafes = cafes.filter(cafe => 
      cafe.status === 'Visited' || cafe.status === 'Contracted').length;
    const contractedCafes = cafes.filter(cafe => cafe.status === 'Contracted').length;
    
    // Calculate detailed size-based counts with detailed logging
    const visitedOrContractedCafes = cafes.filter(cafe => 
      cafe.status === 'Visited' || cafe.status === 'Contracted');
    
    console.log("Visited or contracted cafes:", visitedOrContractedCafes);
      
    const visitSmall = visitedOrContractedCafes.filter(cafe => 
      getCafeSize(cafe.numberOfHookahs) === 'Small').length;
    const visitMedium = visitedOrContractedCafes.filter(cafe => 
      getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
    const visitLarge = visitedOrContractedCafes.filter(cafe => 
      getCafeSize(cafe.numberOfHookahs) === 'Large').length;
    const visitInNegotiation = visitedOrContractedCafes.filter(cafe => 
      getCafeSize(cafe.numberOfHookahs) === 'In Negotiation').length;
    
    // For contracted cafes (only 'Contracted' status)
    const contractedOnlyCafes = cafes.filter(cafe => cafe.status === 'Contracted');
    console.log("Contracted only cafes:", contractedOnlyCafes);
    
    const contractSmall = contractedOnlyCafes.filter(cafe => 
      getCafeSize(cafe.numberOfHookahs) === 'Small').length;
    const contractMedium = contractedOnlyCafes.filter(cafe => 
      getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
    const contractLarge = contractedOnlyCafes.filter(cafe => 
      getCafeSize(cafe.numberOfHookahs) === 'Large').length;
    
    console.log("URGENT FIX - Calculated stats:", { 
      totalCafes, pendingCafes, visitedCafes, contractedCafes,
      visitSmall, visitMedium, visitLarge, visitInNegotiation,
      contractSmall, contractMedium, contractLarge
    });
    
    // Update state immediately
    setStats({ totalCafes, pendingCafes, visitedCafes, contractedCafes });
    setVisitDetails({
      small: visitSmall,
      medium: visitMedium, 
      large: visitLarge,
      inNegotiation: visitInNegotiation,
      total: visitedCafes
    });
    setContractDetails({
      small: contractSmall,
      medium: contractMedium,
      large: contractLarge,
      total: contractedCafes
    });
    
    // Dispatch an event to notify other components that stats have been updated
    window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
      detail: { 
        totalCafes, 
        pendingCafes, 
        visitedCafes, 
        contractedCafes,
        visitCounts: {
          small: visitSmall,
          medium: visitMedium,
          large: visitLarge,
          inNegotiation: visitInNegotiation,
          total: visitedCafes
        },
        contractCounts: {
          small: contractSmall,
          medium: contractMedium,
          large: contractLarge,
          total: contractedCafes
        }
      }
    }));
  }, [cafes]); // React immediately to any cafe changes

  // Format the detailed counts with targets
  const formatVisitCountDetails = () => {
    if (!kpiSettings) return 'Loading...';
    
    return [
      `Large: ${visitDetails.large}/${kpiSettings.targetVisitsLarge}`,
      `Medium: ${visitDetails.medium}/${kpiSettings.targetVisitsMedium}`,
      `Small: ${visitDetails.small}/${kpiSettings.targetVisitsSmall}`
    ].join(' • ');
  };
  
  const formatContractCountDetails = () => {
    if (!kpiSettings) return 'Loading...';
    
    return [
      `Large: ${contractDetails.large}/${kpiSettings.targetContractsLarge}`,
      `Medium: ${contractDetails.medium}/${kpiSettings.targetContractsMedium}`,
      `Small: ${contractDetails.small}/${kpiSettings.targetContractsSmall}`
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
