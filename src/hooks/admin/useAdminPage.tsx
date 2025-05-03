
import { useEffect, useState, useRef } from 'react';
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
  const lastRefreshTimeRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);

  // Greatly reduced aggressiveness in data refresh - only runs once on mount
  useEffect(() => {
    if (isAdmin && authenticated && !isRefreshingRef.current) {
      console.log("Admin page mounted or auth changed, performing INITIAL data refresh");
      
      // Mark as refreshing to prevent duplicate refreshes
      isRefreshingRef.current = true;
      
      // Enable realtime for critical tables immediately
      const tables = ['cafes', 'cafe_surveys', 'brand_sales', 'users'];
      tables.forEach(table => {
        console.log(`Enabling realtime for ${table}`);
        enableRealtimeForTable(table);
      });
      
      // Force immediate data refresh only once
      const forceRefresh = async () => {
        try {
          console.log(`Forcing immediate data refresh (attempt ${refreshAttemptCount + 1})`);
          toast.info("Refreshing all data...");
          
          const now = Date.now();
          lastRefreshTimeRef.current = now;
          
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
        } finally {
          // Allow refreshing again after a significant delay
          setTimeout(() => {
            isRefreshingRef.current = false;
          }, 30000); // 30 seconds cooldown
        }
      };
      
      forceRefresh();
    }
  }, [isAdmin, authenticated]);

  // Drastically reduced frequency of periodic refreshes - changed from every 15 seconds to 2 minutes
  useEffect(() => {
    if (isAdmin && authenticated) {
      console.log("Setting up Admin page refresh intervals with GREATLY reduced frequency");
      
      // Greatly reduce frequency - from 15 seconds to 2 minutes
      const cafeRefreshInterval = setInterval(() => {
        const now = Date.now();
        // Only refresh if last refresh was more than 2 minutes ago
        if (now - lastRefreshTimeRef.current > 120000) {
          console.log("Admin periodic cafe refresh");
          lastRefreshTimeRef.current = now;
          refreshCafes();
          refreshCafeData();
        }
      }, 120000); // Reduced from 15s to 120s (2 minutes)
      
      // Reduce frequency - from 15 seconds to 2 minutes
      const userRefreshInterval = setInterval(() => {
        const now = Date.now();
        // Only refresh if last refresh was more than 2 minutes ago
        if (now - lastRefreshTimeRef.current > 120000) {
          console.log("Admin periodic user refresh");
          lastRefreshTimeRef.current = now;
          fetchUsers(true);
        }
      }, 120000); // Reduced from 15s to 120s (2 minutes)
      
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
