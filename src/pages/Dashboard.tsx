import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/contexts/LanguageContext';
import UserDashboard from '@/components/UserDashboard';
import UserSalaryCards from '@/components/dashboard/UserSalaryCards';
import UserKpiStats from '@/components/UserKpiStats';
import UserBonusSummary from '@/components/dashboard/UserBonusSummary';
import { AdminDashboardSummary } from '@/components/dashboard/AdminDashboardSummary';
import AdminUserTabs from '@/components/dashboard/AdminUserTabs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useDashboardDataRefresh } from '@/components/dashboard/useDashboardDataRefresh';
import UserDeletionLogs from '@/components/dashboard/UserDeletionLogs';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  
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
  
  // Critical: Force refresh on mount to ensure data is loaded
  useEffect(() => {
    console.log("Dashboard - Performing initial data refresh");
    // Force refresh with no debouncing
    refreshCafes(true).catch(err => console.error("Dashboard refresh error:", err));
    
    // Also listen for data update events
    const handleDataUpdate = () => {
      console.log("Dashboard - Data update event received");
      refreshCafes(true).catch(err => console.error("Dashboard refresh error:", err));
    };
    
    window.addEventListener('cafe_data_force_refresh', handleDataUpdate);
    window.addEventListener('cafe_added', handleDataUpdate);
    
    return () => {
      window.removeEventListener('cafe_data_force_refresh', handleDataUpdate);
      window.removeEventListener('cafe_added', handleDataUpdate);
    };
  }, [refreshCafes]);
  
  // Use the custom hook for periodic data refresh
  useDashboardDataRefresh({ refreshCafes });
  
  // Calculate stats with immediate rendering
  const visitCounts = getVisitCounts();
  const contractCounts = getContractCounts();
  const salaryStats = calculateSalary();
  
  console.log("Dashboard render - cafes count:", cafes.length);
  console.log("Dashboard render - Visit counts:", visitCounts);
  console.log("Dashboard render - Contract counts:", contractCounts);
  
  // Admin dashboard view
  if (isAdmin) {
    return (
      <div className="space-y-8">
        <DashboardHeader isAdmin={isAdmin} />

        <Tabs defaultValue="summary" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="summary">{t('dashboard.summary')}</TabsTrigger>
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
  
  // Regular user dashboard view with added deletion logs tab
  return (
    <div className="space-y-8">
      <DashboardHeader isAdmin={isAdmin} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
          <TabsTrigger value="deletions">{t('dashboard.deletion.history')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="deletions">
          <UserDeletionLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
