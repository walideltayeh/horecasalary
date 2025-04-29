
import React, { useEffect } from 'react';
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
  
  // Add effect to refresh data when the component mounts
  useEffect(() => {
    console.log(`UserDashboard for ${userName} mounted, refreshing data`);
    refreshCafes();
    
    // Also listen for data update events
    const handleDataUpdated = () => {
      console.log(`UserDashboard for ${userName} detected data update`);
      refreshCafes();
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
    };
  }, [refreshCafes, userName]);
  
  const salaryStats = calculateUserSalary(userId);
  const visitCounts = getUserVisitCounts(userId);
  const contractCounts = getUserContractCounts(userId);
  const userCafes = cafes.filter(cafe => cafe.createdBy === userId);
  
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
