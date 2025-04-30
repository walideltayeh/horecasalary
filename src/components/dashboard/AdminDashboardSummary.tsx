
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsOverview } from '../admin/StatsOverview';
import AdminUserTabs from './AdminUserTabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCafes } from '@/contexts/CafeContext';
import { useDashboardDataRefresh } from './useDashboardDataRefresh';

export const AdminDashboardSummary: React.FC = () => {
  const { users } = useAuth();
  const { cafes, refreshCafes } = useCafes();
  
  // Force data refresh on component mount
  useEffect(() => {
    console.log("AdminDashboardSummary mounted, refreshing data");
    refreshCafes();
  }, [refreshCafes]);
  
  // Set up event listeners for data updates
  useEffect(() => {
    const handleDataUpdated = () => {
      console.log("AdminDashboardSummary detected data update event");
      refreshCafes();
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
    };
  }, [refreshCafes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor team performance and stats</p>
      </div>
      
      {/* Summary Cards */}
      <StatsOverview cafes={cafes} />
      
      {/* User Performance Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>User Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="all">All Users</TabsTrigger>
              {users.filter(u => u.role === 'user').map((user) => (
                <TabsTrigger key={user.id} value={user.id}>{user.name}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {/* This will be a summary of all users */}
              <p>Overview of all user performance</p>
            </TabsContent>
            
            <AdminUserTabs users={users} />
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardSummary;
