
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { refreshCafeData } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminRefresh } from './useAdminRefresh';

export const useAdminPage = () => {
  const { isAdmin, addUser, deleteUser, updateUser, users, fetchUsers, isLoadingUsers } = useAuth();
  const { cafes, refreshCafes, loading: loadingCafes } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const { handleRefreshCafes, enableRealtimeForTable } = useAdminRefresh();
  const [refreshAttemptCount, setRefreshAttemptCount] = useState(0);

  // Force immediate data refresh when admin page is mounted or authentication changes
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Admin page mounted or auth changed, performing IMMEDIATE data refresh");
      
      // Enable realtime for critical tables immediately
      const tables = ['cafes', 'cafe_surveys', 'brand_sales', 'users'];
      tables.forEach(table => {
        console.log(`Enabling realtime for ${table}`);
        enableRealtimeForTable(table);
      });
      
      // Force immediate data refresh with retries
      const forceRefresh = async () => {
        try {
          console.log(`Forcing immediate data refresh (attempt ${refreshAttemptCount + 1})`);
          toast.info("Refreshing all data...");
          
          // Force fetch cafes with high priority
          await refreshCafeData();
          await refreshCafes();
          
          // Force fetch users with high priority
          await fetchUsers(true);
          
          // Dispatch global refresh event
          window.dispatchEvent(new CustomEvent('global_data_refresh'));
          
          if (users.length > 0 || cafes.length > 0) {
            toast.success(`Data refreshed successfully: ${users.length} users, ${cafes.length} cafes`);
          } else if (refreshAttemptCount < 3) {
            // If no data, retry up to 3 times
            setTimeout(() => {
              setRefreshAttemptCount(prev => prev + 1);
            }, 2000);
          } else {
            toast.warning("Data may not be fully loaded. Try refreshing manually.");
          }
        } catch (error) {
          console.error("Error during initial data refresh:", error);
          toast.error("Failed to refresh data");
        }
      };
      
      forceRefresh();
    }
  }, [isAdmin, authenticated, refreshCafes, fetchUsers, refreshAttemptCount, users.length, cafes.length]);

  // Set up periodic refreshes for admin page
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Setting up Admin page refresh intervals");
      
      // Refresh cafes every 10 seconds
      const cafeRefreshInterval = setInterval(() => {
        console.log("Admin periodic cafe refresh");
        refreshCafes();
        refreshCafeData();
      }, 10000);
      
      // Refresh users every 10 seconds
      const userRefreshInterval = setInterval(() => {
        console.log("Admin periodic user refresh");
        fetchUsers(true);
      }, 10000);
      
      return () => {
        console.log("Clearing Admin page refresh intervals");
        clearInterval(cafeRefreshInterval);
        clearInterval(userRefreshInterval);
      };
    }
  }, [isAdmin, authenticated, refreshCafes, fetchUsers]);

  // User management handlers
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

  return {
    isAdmin,
    users,
    isLoadingUsers,
    cafes,
    loadingCafes,
    authenticated,
    setAuthenticated,
    isDeletingUser,
    isAddingUser,
    selectedTab,
    handleRefreshCafes,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    refreshCafes,
    fetchUsers
  };
};
