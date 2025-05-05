
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from '@/contexts/DataContext';
import CafeList from './CafeList';
import UserKpiStats from './UserKpiStats';
import UserSalaryCards from './dashboard/UserSalaryCards';

interface UserDashboardProps {
  userId: string;
  userName: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userId, userName }) => {
  const { 
    cafes,
    kpiSettings,
    calculateUserSalary,
    getUserVisitCounts,
    getUserContractCounts,
    refreshCafes
  } = useData();
  
  // Store last refresh time to prevent excessive refreshes
  const lastRefreshTime = useRef(Date.now());
  
  // Refresh cafe data with throttling
  const throttledRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 10000) { // 10 seconds throttling
      console.log("UserDashboard - Refresh throttled");
      return; 
    }
    
    lastRefreshTime.current = now;
    console.log("UserDashboard - Refreshing data");
    await refreshCafes();
  }, [refreshCafes]);
  
  // Add effect to refresh data only once when the component mounts
  useEffect(() => {
    console.log("UserDashboard - Initial data refresh");
    throttledRefresh();
    
    // Use managed event listeners with throttling for better performance
    const handleStatsUpdated = () => {
      throttledRefresh();
    };
    
    // Only listen for critical updates with debouncing
    const handleDataUpdated = (e: CustomEvent) => {
      const detail = e.detail || {};
      // Only refresh for specific critical events
      if (detail.action === 'statusUpdate' || 
          detail.action === 'cafeCreated' || 
          detail.action === 'cafeDeleted') {
        throttledRefresh();
      }
    };
    
    window.addEventListener('cafe_stats_updated', handleStatsUpdated);
    window.addEventListener('horeca_data_updated', handleDataUpdated as any);
    
    return () => {
      window.removeEventListener('cafe_stats_updated', handleStatsUpdated);
      window.removeEventListener('horeca_data_updated', handleDataUpdated as any);
    };
  }, [throttledRefresh, userName]);
  
  // Memoize expensive calculations to prevent recalculation on every render
  const salaryStats = useMemo(() => calculateUserSalary(userId), [calculateUserSalary, userId]);
  const visitCounts = useMemo(() => getUserVisitCounts(userId), [getUserVisitCounts, userId]);
  const contractCounts = useMemo(() => getUserContractCounts(userId), [getUserContractCounts, userId]);
  
  // Memoize filtered cafes to prevent filtering on every render
  const userCafes = useMemo(() => 
    cafes.filter(cafe => cafe.createdBy === userId), 
    [cafes, userId]
  );
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{userName}'s Dashboard</h2>
      
      {/* Salary Summary */}
      <UserSalaryCards 
        salaryStats={salaryStats} 
        kpiSettings={kpiSettings} 
      />
      
      {/* KPI Performance */}
      <UserKpiStats
        salaryStats={salaryStats}
        visitCounts={visitCounts}
        contractCounts={contractCounts}
        kpiSettings={kpiSettings}
      />
      
      {/* Cafes List */}
      <Card>
        <CardHeader>
          <CardTitle>Cafes Created by {userName}</CardTitle>
        </CardHeader>
        <CardContent>
          <CafeList filterByUser={userId} adminView={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(UserDashboard);
