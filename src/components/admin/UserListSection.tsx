
import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/types";
import UserList from './UserList';
import { isOnline } from '@/utils/networkUtils';

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
    
    // Check if online
    if (!isOnline()) {
      console.log("Device appears to be offline, cannot refresh");
      return;
    }
    
    try {
      setIsRefreshing(true);
      lastRefreshTimeRef.current = now;
      await onRefreshUsers();
    } catch (err) {
      console.error("Error during refresh:", err);
    } finally {
      // Add a minimum visual feedback time
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    }
  };
  
  // Show empty state content when no users are found and not loading
  const showEmptyState = !isLoadingUsers && users.length === 0 && !error;

  // Show no admin error when not even an admin user is present
  const noAdminInDb = !isLoadingUsers && users.length === 0 && !error;
  
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
            <AlertDescription>
              {error} 
              {!isOnline() && " (You appear to be offline)"}
            </AlertDescription>
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

        {showEmptyState && (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-4">
            <UserPlus className="h-12 w-12 text-gray-400" />
            <div>
              <p className="mb-2">No users found in the database.</p>
              <p className="text-sm mb-4">This could be because the users table isn't properly synchronized with authentication.</p>
              {isOnline() ? (
                <Button onClick={handleRefresh} variant="default" size="sm">
                  Refresh Users
                </Button>
              ) : (
                <p className="text-sm text-yellow-600">You appear to be offline.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserListSection;
