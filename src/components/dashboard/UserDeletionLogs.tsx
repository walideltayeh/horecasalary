
import React, { useEffect, useState } from 'react';
import { useDeleteLogger } from '@/hooks/cafe/useDeleteLogger';
import { DeletionLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, History } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const UserDeletionLogs: React.FC = () => {
  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { getDeletionLogs } = useDeleteLogger();
  const { user } = useAuth();
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  
  // Fetch logs function with detailed logging
  const fetchLogs = async () => {
    if (!user?.id) {
      console.error("Cannot fetch logs - user is not logged in");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Fetching deletion logs for user:", user.id);
      // Pass the user's ID to get only their logs
      const logsData = await getDeletionLogs(undefined, undefined, user.id);
      console.log("Fetched deletion logs:", logsData);
      
      if (logsData.length === 0) {
        console.log("No deletion logs found for user:", user.id);
      }
      
      setLogs(logsData);
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error("Error fetching user deletion logs:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchLogs();
    } else {
      console.log("User not logged in, skipping log fetch");
    }
  }, [user?.id]);
  
  // Set up listener for deletion events
  useEffect(() => {
    // Listen for cafe deletion events to refresh logs
    const handleCafeDeleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Cafe deleted event detected:", customEvent.detail);
      
      // Check if this event has user information
      if (customEvent.detail?.userId && user?.id) {
        console.log("User IDs to compare:", customEvent.detail.userId, user.id);
        
        // Only refresh if this deletion was by the current user or if userId is 'unknown'
        if (customEvent.detail.userId === user.id || customEvent.detail.userId === 'unknown') {
          console.log("Refreshing logs as the deletion was by current user");
          
          // Add a small delay to allow the database to update
          setTimeout(() => {
            fetchLogs();
          }, 500);
        }
      } else {
        // No user ID in event, refresh anyway as a fallback
        console.log("No user ID in event detail, refreshing logs as fallback");
        setTimeout(() => {
          fetchLogs();
        }, 500);
      }
    };
    
    // Set up event listener
    window.addEventListener('cafe_deleted', handleCafeDeleted);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('cafe_deleted', handleCafeDeleted);
    };
  }, [user?.id]);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString || 'Unknown date';
    }
  };
  
  const renderEntityInfoPreview = (entityData: Record<string, any> | null, entityType: string) => {
    if (!entityData) {
      return <div className="text-sm italic">No entity data available</div>;
    }
    
    if (entityType.toLowerCase() === 'cafe') {
      return (
        <div className="text-sm">
          <p><strong>Name:</strong> {entityData.name || 'N/A'}</p>
          <p><strong>Owner:</strong> {entityData.ownerName || entityData.owner_name || 'N/A'}</p>
          <p><strong>Location:</strong> {entityData.city || 'N/A'}, {entityData.governorate || 'N/A'}</p>
        </div>
      );
    }
    
    // For other entity types, provide a simpler view
    return (
      <div className="text-sm">
        <p><strong>Type:</strong> {entityType}</p>
        <p><strong>ID:</strong> {entityData.id || 'N/A'}</p>
      </div>
    );
  };
  
  // Check if we have logs and no loading state
  const hasNoResults = !loading && logs.length === 0;
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            My Deletion History
          </CardTitle>
          <CardDescription>
            {hasNoResults 
              ? "No deletion records found"
              : `${logs.length} deletion records found`}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={fetchLogs} 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : hasNoResults ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't deleted any items yet</p>
            <p className="text-gray-400 text-sm mt-2">
              When you delete items, they will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Type</TableHead>
                  <TableHead>Deleted At</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="capitalize">{log.entity_type}</TableCell>
                    <TableCell>{formatDate(log.deleted_at)}</TableCell>
                    <TableCell>{renderEntityInfoPreview(log.entity_data, log.entity_type)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDeletionLogs;
