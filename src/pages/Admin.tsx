
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
import { refreshCafeData } from '@/integrations/supabase/client';

const Admin: React.FC = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users, fetchUsers, isLoadingUsers } = useAuth();
  const { cafes, refreshCafes, loading: loadingCafes } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const { handleRefreshCafes, enableRealtimeForTable } = useAdminRefresh();
  const [refreshAttemptCount, setRefreshAttemptCount] = useState(0);

  // Reduced aggressiveness in data refresh
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Admin page mounted or auth changed, performing INITIAL data refresh");
      
      // Enable realtime for critical tables immediately
      const tables = ['cafes', 'cafe_surveys', 'brand_sales', 'users'];
      tables.forEach(table => {
        console.log(`Enabling realtime for ${table}`);
        enableRealtimeForTable(table);
      });
      
      // Force immediate data refresh
      const forceRefresh = async () => {
        try {
          console.log(`Forcing immediate data refresh (attempt ${refreshAttemptCount + 1})`);
          toast.info("Refreshing all data...");
          
          // Force fetch users immediately with higher priority
          await fetchUsers(true);
          
          // Force refresh cafes immediately
          await refreshCafes();
          await handleRefreshCafes();
          
          // Trigger global refresh event
          window.dispatchEvent(new CustomEvent('horeca_data_refresh_requested'));
          refreshCafeData();
          
          if (users.length > 0 && cafes.length > 0) {
            toast.success(`Data refreshed successfully: ${users.length} users, ${cafes.length} cafes`);
          } else {
            // If we don't have data yet, try again in 2 seconds (up to 3 attempts)
            if (refreshAttemptCount < 3) {
              setTimeout(() => {
                setRefreshAttemptCount(prev => prev + 1);
              }, 2000);
            } else {
              toast.warning("Data may not be fully loaded. Try refreshing manually.");
            }
          }
        } catch (error) {
          console.error("Error during initial data refresh:", error);
          toast.error("Failed to refresh data");
        }
      };
      
      forceRefresh();
    }
  }, [isAdmin, authenticated, fetchUsers, refreshCafes, handleRefreshCafes, enableRealtimeForTable, refreshAttemptCount, users.length, cafes.length]);

  // Reduced frequency of periodic refreshes for cafes
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Setting up Admin page refresh intervals with reduced frequency");
      
      // Reduce frequency - from 5 seconds to 15 seconds
      const cafeRefreshInterval = setInterval(() => {
        console.log("Admin periodic cafe refresh");
        refreshCafes();
        refreshCafeData();
      }, 15000); // Reduced from 5s to 15s
      
      // Reduce frequency - from 5 seconds to 15 seconds
      const userRefreshInterval = setInterval(() => {
        console.log("Admin periodic user refresh");
        fetchUsers(true);
      }, 15000); // Reduced from 5s to 15s
      
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
    setRefreshAttemptCount(0);
    // Force refresh after authentication with a short delay to ensure everything is set up
    setTimeout(() => {
      console.log("Admin authenticated, forcing data refresh");
      fetchUsers(true);
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
      await fetchUsers(true);
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
        await fetchUsers(true);
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
        await fetchUsers(true);
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
        onRefreshUsers={() => fetchUsers(true)}
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
