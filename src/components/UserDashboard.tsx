
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from '@/contexts/DataContext';
import CafeList from './CafeList';
import UserKpiStats from './dashboard/UserKpiStats';
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
  
  // Add effect to refresh data only once when the component mounts
  useEffect(() => {
    const refreshData = async () => {
      console.log("UserDashboard - Initial data refresh");
      await refreshCafes();
    };
    
    refreshData();
    
    // Listen for stats update events for immediate refresh
    const handleStatsUpdated = () => {
      const now = Date.now();
      if (now - lastRefreshTime.current < 5000) {
        return; // Throttle updates
      }
      
      lastRefreshTime.current = now;
      console.log("UserDashboard - Refreshing due to stats update");
      refreshCafes();
    };
    
    // Only listen for critical updates
    const handleDataUpdated = (e: CustomEvent) => {
      const detail = e.detail || {};
      // Only refresh for specific critical events
      if (detail.action === 'statusUpdate' || 
          detail.action === 'cafeCreated' || 
          detail.action === 'cafeDeleted') {
            
        // Add throttling
        const now = Date.now();
        if (now - lastRefreshTime.current < 5000) {
          return;
        }
            
        lastRefreshTime.current = now;
        console.log("UserDashboard - Refreshing due to data update:", detail.action);
        refreshCafes();
      }
    };
    
    window.addEventListener('cafe_stats_updated', handleStatsUpdated);
    window.addEventListener('horeca_data_updated', handleDataUpdated as any);
    return () => {
      window.removeEventListener('cafe_stats_updated', handleStatsUpdated);
      window.removeEventListener('horeca_data_updated', handleDataUpdated as any);
    };
  }, [refreshCafes, userName]);
  
  const salaryStats = calculateUserSalary(userId);
  const visitCounts = getUserVisitCounts(userId);
  const contractCounts = getUserContractCounts(userId);
  const userCafes = cafes.filter(cafe => cafe.createdBy === userId);
  
  console.log("UserDashboard render - Visit counts:", visitCounts);
  console.log("UserDashboard render - Contract counts:", contractCounts);
  
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

export default UserDashboard;
