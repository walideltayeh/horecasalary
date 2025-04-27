
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/types";
import { toast } from "sonner";
import UserManagementForm from './UserManagementForm';
import UserList from './UserList';
import EditUserDialog from './EditUserDialog';
import { useUserEditDialog } from './useUserEditDialog';

interface UserManagementProps {
  users: User[];
  isLoadingUsers: boolean;
  error: string | null;
  isAddingUser: boolean;
  isDeletingUser: string | null;
  onAddUser: (userData: { name: string; email: string; password: string; role: 'admin' | 'user' }) => Promise<void>;
  onEditUser: (userId: string, userData: any) => Promise<void>;
  onDeleteUser: (userId: string, userName: string) => Promise<void>;
  onRefreshUsers: () => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  isLoadingUsers,
  error,
  isAddingUser,
  isDeletingUser,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onRefreshUsers
}) => {
  const {
    editDialogOpen,
    setEditDialogOpen,
    editUser,
    openEditDialog,
    handleEditInputChange,
    handleEditRoleChange
  } = useUserEditDialog();

  const handleEditUserSave = async () => {
    try {
      await onEditUser(editUser.id, editUser);
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Add and manage users</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementForm
            onAddUser={onAddUser}
            isAddingUser={isAddingUser}
          />
        </CardContent>
      </Card>
      
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User List</CardTitle>
            <CardDescription>Users registered in the system ({users.length})</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefreshUsers}
            disabled={isLoadingUsers}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoadingUsers ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <UserList
              users={users}
              onEditUser={openEditDialog}
              onDeleteUser={onDeleteUser}
              isDeletingUser={isDeletingUser}
            />
          )}
        </CardContent>
      </Card>

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
