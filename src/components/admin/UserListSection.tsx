
import React, { useMemo } from 'react';
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
  // Count user total only when the array changes
  const userCount = useMemo(() => users.length, [users]);
  
  // Throttle refresh button clicks
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const lastRefreshTimeRef = React.useRef(0);
  
  const handleRefresh = async () => {
    const now = Date.now();
    // Throttle to once every 5 seconds
    if (now - lastRefreshTimeRef.current < 5000) {
      console.log("Refresh throttled, too recent");
      return;
    }
    
    try {
      setIsRefreshing(true);
      lastRefreshTimeRef.current = now;
      await onRefreshUsers();
    } finally {
      // Add a minimum visual feedback time
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    }
  };
  
  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User List</CardTitle>
          <CardDescription>Users registered in the system ({userCount})</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing || isLoadingUsers}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || isLoadingUsers ? 'animate-spin' : ''}`} />
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
