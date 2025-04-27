
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Navigate } from 'react-router-dom';
import PasswordProtection from '@/components/PasswordProtection';
import { UserPerformance } from '@/components/admin/UserPerformance';
import { CafeDatabase } from '@/components/admin/CafeDatabase';
import SystemStats from '@/components/admin/SystemStats';
import UserManagement from '@/components/admin/UserManagement';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminHeader from '@/components/admin/AdminHeader';
import CafeStatsCard from '@/components/admin/CafeStatsCard';
import { useAdminRefresh } from '@/hooks/admin/useAdminRefresh';

const Admin: React.FC = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users, fetchUsers, isLoadingUsers } = useAuth();
  const { cafes, refreshCafes, loading: loadingCafes } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const { handleRefreshCafes, enableRealtimeForTable } = useAdminRefresh();

  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Admin page mounted, refreshing ALL data");
      fetchUsers();
      
      // Force enable realtime for tables
      const tables = ['cafes', 'cafe_surveys', 'brand_sales'];
      tables.forEach(table => enableRealtimeForTable(table));
      
      // Call refresh cafes immediately and force data reload
      refreshCafes();
      handleRefreshCafes();
    }
  }, [isAdmin, authenticated, fetchUsers, refreshCafes, handleRefreshCafes, enableRealtimeForTable]);

  // Additional periodic refreshes for cafes when on Admin page
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Setting up Admin page refresh intervals");
      
      // Immediate refresh
      refreshCafes();
      
      // Then periodic refresh
      const cafeRefreshInterval = setInterval(() => {
        console.log("Admin periodic cafe refresh");
        refreshCafes();
      }, 10000); // Refresh every 10 seconds while on Admin page
      
      return () => {
        console.log("Clearing Admin page refresh intervals");
        clearInterval(cafeRefreshInterval);
      };
    }
  }, [isAdmin, authenticated, refreshCafes]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  if (!authenticated) {
    return <PasswordProtection 
      onAuthenticate={() => {
        setAuthenticated(true);
        // Force refresh after authentication
        setTimeout(() => {
          refreshCafes();
          handleRefreshCafes();
        }, 500);
      }} 
      title="Admin Panel" 
    />;
  }

  const handleUserActions = {
    add: async (userData: any) => {
      setIsAddingUser(true);
      try {
        await addUser(userData);
        await fetchUsers();
      } finally {
        setIsAddingUser(false);
      }
    },
    edit: async (userId: string, userData: any) => {
      try {
        const success = await updateUser(userId, userData);
        if (success) {
          if (selectedTab === userId && userData.role === 'admin') {
            setSelectedTab("all");
          }
          await fetchUsers();
        }
      } catch (error) {
        console.error("Error updating user:", error);
      }
    },
    delete: async (userId: string, userName: string) => {
      if (confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`)) {
        setIsDeletingUser(userId);
        try {
          const success = await deleteUser(userId);
          if (success && selectedTab === userId) {
            setSelectedTab("all");
          }
          await fetchUsers();
        } finally {
          setIsDeletingUser(null);
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <AdminHeader onRefreshCafes={handleRefreshCafes} loadingCafes={loadingCafes} />
      <CafeStatsCard cafes={cafes} loadingCafes={loadingCafes} />
      
      <UserManagement
        users={users}
        isLoadingUsers={isLoadingUsers}
        error={null}
        isAddingUser={isAddingUser}
        isDeletingUser={isDeletingUser}
        onAddUser={handleUserActions.add}
        onEditUser={handleUserActions.edit}
        onDeleteUser={handleUserActions.delete}
        onRefreshUsers={fetchUsers}
      />
      
      <UserPerformance users={users} cafes={cafes} />
      <CafeDatabase cafes={cafes} />
      
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemStats cafes={cafes} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
