
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
import { toast } from 'sonner';

const Admin: React.FC = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users, fetchUsers, isLoadingUsers } = useAuth();
  const { cafes, refreshCafes, loading: loadingCafes } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const { handleRefreshCafes, enableRealtimeForTable } = useAdminRefresh();
  const [autoRefreshStarted, setAutoRefreshStarted] = useState(false);

  // Super aggressive data refresh when the component is mounted
  useEffect(() => {
    if (isAdmin && authenticated && !autoRefreshStarted) {
      console.log("Admin page mounted, performing INITIAL data refresh");
      
      // Enable realtime for critical tables immediately
      const tables = ['cafes', 'cafe_surveys', 'brand_sales'];
      tables.forEach(table => {
        console.log(`Enabling realtime for ${table}`);
        enableRealtimeForTable(table);
      });
      
      // Force immediate data refresh
      const forceRefresh = async () => {
        try {
          console.log("Forcing immediate data refresh");
          toast.info("Refreshing all data...");
          
          // Force fetch users immediately
          await fetchUsers();
          
          // Force refresh cafes immediately
          await refreshCafes();
          await handleRefreshCafes();
          
          // Trigger global refresh event
          window.dispatchEvent(new CustomEvent('horeca_data_refresh_requested'));
          
          toast.success("All data refreshed successfully");
          setAutoRefreshStarted(true);
        } catch (error) {
          console.error("Error during initial data refresh:", error);
          toast.error("Failed to refresh data");
        }
      };
      
      forceRefresh();
    }
  }, [isAdmin, authenticated, fetchUsers, refreshCafes, handleRefreshCafes, enableRealtimeForTable, autoRefreshStarted]);

  // Additional periodic refreshes for cafes when on Admin page
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Setting up Admin page refresh intervals");
      
      // Then periodic refresh - more frequent for admin page
      const cafeRefreshInterval = setInterval(() => {
        console.log("Admin periodic cafe refresh");
        refreshCafes();
      }, 5000); // Refresh every 5 seconds while on Admin page
      
      const userRefreshInterval = setInterval(() => {
        console.log("Admin periodic user refresh");
        fetchUsers();
      }, 5000); // Refresh users every 5 seconds
      
      return () => {
        console.log("Clearing Admin page refresh intervals");
        clearInterval(cafeRefreshInterval);
        clearInterval(userRefreshInterval);
      };
    }
  }, [isAdmin, authenticated, refreshCafes, fetchUsers]);

  // Reset refresh and force update when authenticated
  const handleAuthenticated = () => {
    setAuthenticated(true);
    // Force refresh after authentication with a short delay to ensure everything is set up
    setTimeout(() => {
      console.log("Admin authenticated, forcing data refresh");
      fetchUsers();
      refreshCafes();
      handleRefreshCafes();
      // Trigger global refresh event
      window.dispatchEvent(new CustomEvent('horeca_data_refresh_requested'));
      toast.success("Admin authenticated successfully. Loading data...");
    }, 500);
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  if (!authenticated) {
    return <PasswordProtection 
      onAuthenticate={handleAuthenticated} 
      title="Admin Panel" 
    />;
  }

  console.log("Admin render with users:", users);
  console.log("Admin render with cafes:", cafes);

  const handleAddUser = async (userData: any) => {
    setIsAddingUser(true);
    try {
      await addUser(userData);
      toast.success(`User ${userData.name} added successfully`);
      await fetchUsers();
    } finally {
      setIsAddingUser(false);
    }
  };
  
  const handleEditUser = async (userId: string, userData: any) => {
    try {
      const success = await updateUser(userId, userData);
      if (success) {
        toast.success(`User ${userData.name} updated successfully`);
        if (userData.role === 'admin') {
          setSelectedTab("all");
        }
        await fetchUsers();
      }
      return success;
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error updating user");
      return false;
    }
  };
  
  const handleDeleteUser = async (userId: string, userName: string) => {
    setIsDeletingUser(userId);
    try {
      const success = await deleteUser(userId);
      if (success) {
        toast.success(`User ${userName} deleted successfully`);
        if (selectedTab === userId) {
          setSelectedTab("all");
        }
        await fetchUsers();
      }
      return success;
    } finally {
      setIsDeletingUser(null);
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
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onRefreshUsers={fetchUsers}
        isAddingUser={isAddingUser}
        isDeletingUser={isDeletingUser}
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
