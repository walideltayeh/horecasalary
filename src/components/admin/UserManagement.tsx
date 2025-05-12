
import React, { useState, useEffect, useCallback } from 'react';
import { User } from "@/types";
import UserManagementSection from './UserManagementSection';
import UserListSection from './UserListSection';
import EditUserDialog from './EditUserDialog';
import { useUserEditDialog } from './useUserEditDialog';
import { useUserActions } from '@/hooks/admin/useUserActions';
import { toast } from 'sonner';

interface UserManagementProps {
  users: User[];
  isLoadingUsers: boolean;
  error: string | null;
  onAddUser: (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => Promise<void>;
  onEditUser: (userId: string, userData: any) => Promise<boolean>;
  onDeleteUser: (userId: string, userName: string) => Promise<boolean>;
  onRefreshUsers: () => Promise<void>;
  isAddingUser?: boolean;
  isDeletingUser?: string | null;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  isLoadingUsers,
  error,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onRefreshUsers,
  isAddingUser: propIsAddingUser,
  isDeletingUser: propIsDeletingUser
}) => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const refreshInProgressRef = React.useRef(false);
  
  // Memoize refresh function to prevent recreations
  const refreshUserData = useCallback(async () => {
    // Prevent concurrent refreshes
    if (refreshInProgressRef.current) {
      console.log("User Management refresh already in progress, skipping");
      return;
    }
    
    // Throttle refreshes to at most once every 30 seconds
    const now = Date.now();
    if (now - lastRefreshTime < 30000) {
      console.log("User Management throttling refresh - too recent");
      return;
    }
    
    try {
      console.log("UserManagement refreshing data");
      refreshInProgressRef.current = true;
      setLastRefreshTime(now);
      await onRefreshUsers();
    } catch (error) {
      console.error("Error during users refresh:", error);
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [onRefreshUsers, lastRefreshTime]);
  
  // Significantly reduced polling frequency - from every 5s to every 2 minutes
  useEffect(() => {
    // Only fetch on mount, not on every interval
    if (!isLoadingUsers) {
      refreshUserData();
    }
    
    // Set up very infrequent polling - once every 2 minutes
    const pollInterval = setInterval(() => {
      refreshUserData();
    }, 120000); // 2 minutes in ms
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [refreshUserData, isLoadingUsers]);
  
  // Listen for user data change events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'users_updated') {
        // Add delay to prevent concurrent requests
        setTimeout(() => {
          refreshUserData();
        }, 5000);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshUserData]);
  
  const {
    editDialogOpen,
    setEditDialogOpen,
    editUser,
    openEditDialog,
    handleEditInputChange,
    handleEditRoleChange
  } = useUserEditDialog();

  const {
    isAddingUser,
    isDeletingUser,
    handleAddUser,
    handleEditUser,
    handleDeleteUser
  } = useUserActions({
    onAddUser,
    onEditUser,
    onDeleteUser,
    onRefreshUsers,
    setSelectedTab
  });

  const handleEditUserSave = async () => {
    try {
      const success = await handleEditUser(editUser.id, editUser);
      if (success) {
        setEditDialogOpen(false);
        toast.success("User updated successfully");
        // Force refresh after edit with delay to prevent race conditions
        setTimeout(() => {
          onRefreshUsers();
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  // Use prop values if provided, otherwise use values from the hook
  const effectiveIsAddingUser = propIsAddingUser !== undefined ? propIsAddingUser : isAddingUser;
  const effectiveIsDeletingUser = propIsDeletingUser !== undefined ? propIsDeletingUser : isDeletingUser;
  
  return (
    <>
      <UserManagementSection
        onAddUser={handleAddUser}
        isAddingUser={effectiveIsAddingUser}
      />
      
      <UserListSection
        users={users}
        isLoadingUsers={isLoadingUsers}
        error={error}
        isDeletingUser={effectiveIsDeletingUser}
        onEditUser={openEditDialog}
        onDeleteUser={handleDeleteUser}
        onRefreshUsers={refreshUserData}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editUser={editUser}
        onInputChange={handleEditInputChange}
        onRoleChange={handleEditRoleChange}
        onSave={handleEditUserSave}
        isEditing={isDeletingUser === editUser.id}
      />
    </>
  );
};

export default UserManagement;
