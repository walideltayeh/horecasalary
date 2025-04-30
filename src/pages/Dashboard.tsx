
import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserDashboard from '@/components/UserDashboard';
import UserSalaryCards from '@/components/dashboard/UserSalaryCards';
import UserKpiStats from '@/components/dashboard/UserKpiStats';
import UserBonusSummary from '@/components/dashboard/UserBonusSummary';
import { AdminDashboardSummary } from '@/components/dashboard/AdminDashboardSummary';
import AdminUserTabs from '@/components/dashboard/AdminUserTabs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useDashboardDataRefresh } from '@/components/dashboard/useDashboardDataRefresh';

const Dashboard: React.FC = () => {
  const { 
    getVisitCounts, 
    getContractCounts, 
    calculateSalary,
    kpiSettings,
    refreshCafes,
    cafes
  } = useData();
  
  const { user, users, isAdmin } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>(user?.id || 'summary');
  
  // Use the custom hook for data refresh
  useDashboardDataRefresh({ refreshCafes });
  
  // Add extra forced refreshes on mount for consistent data
  useEffect(() => {
    console.log("Dashboard initial render - triggering multiple refreshes for consistency");
    
    // Initial refresh
    refreshCafes();
    
    // Secondary refresh after a short delay
    const timer1 = setTimeout(() => {
      console.log("Dashboard secondary refresh to ensure data consistency");
      refreshCafes();
    }, 1000);
    
    // Tertiary refresh after a longer delay
    const timer2 = setTimeout(() => {
      console.log("Dashboard tertiary refresh to finalize data");
      refreshCafes();
    }, 2500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [refreshCafes]);
  
  // Debug counters
  useEffect(() => {
    if (cafes && cafes.length > 0) {
      console.log("Dashboard detected cafes data:", cafes.length, "cafes");
      console.log("Cafe statuses:", cafes.map(cafe => cafe.status));
      console.log("Contracted cafes:", cafes.filter(cafe => cafe.status === 'Contracted'));
      console.log("Visited cafes:", cafes.filter(cafe => cafe.status === 'Visited' || cafe.status === 'Contracted'));
    }
  }, [cafes]);
  
  const visitCounts = getVisitCounts();
  const contractCounts = getContractCounts();
  const salaryStats = calculateSalary();
  
  // Admin dashboard view
  if (isAdmin) {
    return (
      <div className="space-y-8">
        <DashboardHeader isAdmin={isAdmin} />

        <Tabs defaultValue="summary" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            {users.filter(u => u.role === 'user').map((user) => (
              <TabsTrigger key={user.id} value={user.id}>{user.name}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
            <AdminDashboardSummary />
          </TabsContent>
          
          <AdminUserTabs users={users} />
        </Tabs>
      </div>
    );
  }
  
  // Regular user dashboard view
  return (
    <div className="space-y-8">
      <DashboardHeader isAdmin={isAdmin} />

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

      {/* Bonus Summary */}
      <UserBonusSummary 
        contractCounts={contractCounts}
        kpiSettings={kpiSettings}
        bonusAmount={salaryStats.bonusAmount}
      />
    </div>
  );
};

export default Dashboard;
