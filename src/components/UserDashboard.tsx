
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from '@/contexts/DataContext';
import CafeList from './CafeList';
import UserKpiStats from './UserKpiStats';
import UserSalaryCards from './dashboard/UserSalaryCards';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  
  // Force immediate data refresh on component mount
  useEffect(() => {
    console.log("UserDashboard - Initial data refresh for user:", userName);
    refreshCafes(true);
    
    // Listen for critical updates that require immediate refresh
    const handleCriticalUpdate = () => {
      console.log("UserDashboard - Critical update detected, refreshing data");
      refreshCafes(true);
    };
    
    window.addEventListener('cafe_data_force_refresh', handleCriticalUpdate);
    window.addEventListener('cafe_added', handleCriticalUpdate);
    window.addEventListener('cafe_deleted', handleCriticalUpdate);
    
    return () => {
      window.removeEventListener('cafe_data_force_refresh', handleCriticalUpdate);
      window.removeEventListener('cafe_added', handleCriticalUpdate);
      window.removeEventListener('cafe_deleted', handleCriticalUpdate);
    };
  }, [refreshCafes, userName]);
  
  const salaryStats = calculateUserSalary(userId);
  const visitCounts = getUserVisitCounts(userId);
  const contractCounts = getUserContractCounts(userId);
  const userCafes = cafes.filter(cafe => cafe.createdBy === userId);
  
  console.log("UserDashboard render for:", userName);
  console.log("- User has cafes:", userCafes.length);
  console.log("- Visit counts:", visitCounts);
  console.log("- Contract counts:", contractCounts);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{userName}'s {t('dashboard.title')}</h2>
      
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
          <CardTitle>{t('cafe.created.by')} {userName}</CardTitle>
        </CardHeader>
        <CardContent>
          <CafeList filterByUser={userId} adminView={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
