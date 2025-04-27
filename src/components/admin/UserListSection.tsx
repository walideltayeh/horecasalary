
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/types";
import UserList from './UserList';

interface UserListSectionProps {
  users: User[];
  isLoadingUsers: boolean;
  error: string | null;
  isDeletingUser: string | null;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onRefreshUsers: () => Promise<void>;
}

const UserListSection: React.FC<UserListSectionProps> = ({
  users,
  isLoadingUsers,
  error,
  isDeletingUser,
  onEditUser,
  onDeleteUser,
  onRefreshUsers
}) => {
  return (
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
            onEditUser={onEditUser}
            onDeleteUser={onDeleteUser}
            isDeletingUser={isDeletingUser}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default UserListSection;
