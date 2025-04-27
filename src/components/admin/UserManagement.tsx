
import React, { useState, useEffect } from 'react';
import { User } from "@/types";
import UserManagementSection from './UserManagementSection';
import UserListSection from './UserListSection';
import EditUserDialog from './EditUserDialog';
import { useUserEditDialog } from './useUserEditDialog';
import { useUserActions } from '@/hooks/admin/useUserActions';

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
  
  // Force data refresh on mount
  useEffect(() => {
    console.log("UserManagement mounted, refreshing users data");
    onRefreshUsers();
  }, [onRefreshUsers]);
  
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
      await handleEditUser(editUser.id, editUser);
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Use prop values if provided, otherwise use values from the hook
  const effectiveIsAddingUser = propIsAddingUser !== undefined ? propIsAddingUser : isAddingUser;
  const effectiveIsDeletingUser = propIsDeletingUser !== undefined ? propIsDeletingUser : isDeletingUser;

  console.log("UserManagement render with users:", users);
  
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
        onRefreshUsers={onRefreshUsers}
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
