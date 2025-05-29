
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
  const [initialRefreshDone, setInitialRefreshDone] = useState(false);
  
  // Use the custom hook for data refresh
  useDashboardDataRefresh({ refreshCafes });
  
  // URGENT FIX: Perform aggressive refresh on mount to ensure cafes display
  useEffect(() => {
    if (initialRefreshDone) {
      return;
    }

    const initialRefresh = async () => {
      console.log("Dashboard - URGENT REFRESH - Performing aggressive initial refresh");
      setInitialRefreshDone(true);
      
      // Force multiple refreshes to ensure data loads
      await refreshCafes();
      
      // Additional refresh after short delay
      setTimeout(async () => {
        console.log("Dashboard - Secondary refresh for urgent fix");
        await refreshCafes();
        
        // Force stats update event
        window.dispatchEvent(new CustomEvent('cafe_stats_updated', {
          detail: { forceRefresh: true, urgent: true }
        }));
      }, 1000);
    };
    
    initialRefresh();
    
    // Listen for stats update events
    const handleStatsUpdated = () => {
      console.log("Dashboard - Stats updated event received - urgent fix");
      // Trigger additional refresh if no cafes loaded
      if (cafes.length === 0) {
        console.log("Dashboard - No cafes detected, triggering emergency refresh");
        refreshCafes();
      }
    };
    
    window.addEventListener('cafe_stats_updated', handleStatsUpdated);
    
    return () => {
      window.removeEventListener('cafe_stats_updated', handleStatsUpdated);
    };
  }, [refreshCafes, initialRefreshDone, cafes.length]);
  
  // Calculate stats with immediate rendering and force recalculation
  const visitCounts = getVisitCounts();
  const contractCounts = getContractCounts();
  const salaryStats = calculateSalary();
  
  console.log("Dashboard render - URGENT FIX - Visit counts:", visitCounts);
  console.log("Dashboard render - URGENT FIX - Contract counts:", contractCounts);
  console.log("Dashboard render - URGENT FIX - Total cafes:", cafes.length);
  
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
