
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  
  // Only refresh data once on mount with a delay to avoid excessive data loading
  useEffect(() => {
    if (initialRefreshDone) {
      return;
    }

    const initialRefreshTimer = setTimeout(async () => {
      console.log("Dashboard - Performing single initial refresh");
      setInitialRefreshDone(true);
      await refreshCafes();
      
      // Dispatch stats event to update all UI components
      window.dispatchEvent(new CustomEvent('cafe_stats_updated'));
    }, 100);
    
    return () => clearTimeout(initialRefreshTimer);
  }, [refreshCafes, initialRefreshDone]);
  
  // Optimize event listeners with heavy throttling and debouncing
  useEffect(() => {
    const lastRefreshTimeRef = { current: Date.now() };
    let throttleTimer: NodeJS.Timeout | null = null;
    
    const handleStatsUpdated = () => {
      // Extreme throttling for performance
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < 30000) { // 30 seconds throttle
        return;
      }
      
      // Heavy debounce to prevent multiple updates
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
      
      lastRefreshTimeRef.current = now;
      
      throttleTimer = setTimeout(() => {
        console.log("Dashboard - Stats updated event received (throttled)");
        refreshCafes();
      }, 1000);
    };
    
    window.addEventListener('cafe_stats_updated', handleStatsUpdated);
    
    return () => {
      window.removeEventListener('cafe_stats_updated', handleStatsUpdated);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [refreshCafes]);
  
  // Memoize expensive calculations to prevent recalculation on every render
  const visitCounts = useMemo(() => getVisitCounts(), [getVisitCounts]);
  const contractCounts = useMemo(() => getContractCounts(), [getContractCounts]);
  const salaryStats = useMemo(() => calculateSalary(), [calculateSalary]);
  
  // Memoize the filtered users for admin view to prevent recalculation on every render
  const regularUsers = useMemo(() => 
    users.filter(u => u.role === 'user'),
    [users]
  );
  
  // Admin dashboard view with optimized rendering
  if (isAdmin) {
    return (
      <div className="space-y-8">
        <DashboardHeader isAdmin={isAdmin} />

        <Tabs defaultValue="summary" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            {regularUsers.map((user) => (
              <TabsTrigger key={user.id} value={user.id}>{user.name}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
            <AdminDashboardSummary />
          </TabsContent>
          
          <AdminUserTabs users={regularUsers} />
        </Tabs>
      </div>
    );
  }
  
  // Regular user dashboard view with optimized rendering
  return (
    <div className="space-y-8">
      <DashboardHeader isAdmin={isAdmin} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deletions">Deletion History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Salary Summary - memoized rendering */}
          <UserSalaryCards 
            salaryStats={salaryStats} 
            kpiSettings={kpiSettings} 
          />

          {/* KPI Performance - memoized rendering */}
          <UserKpiStats
            salaryStats={salaryStats}
            visitCounts={visitCounts}
            contractCounts={contractCounts}
            kpiSettings={kpiSettings}
          />

          {/* Bonus Summary - memoized rendering */}
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

export default React.memo(Dashboard);
