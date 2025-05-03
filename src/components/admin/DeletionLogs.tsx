
import React, { useEffect, useState } from 'react';
import { useDeleteLogger } from '@/hooks/cafe/useDeleteLogger';
import { DeletionLog } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const DeletionLogs: React.FC = () => {
  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { getDeletionLogs } = useDeleteLogger();
  const { user } = useAuth();
  
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logsData = await getDeletionLogs();
      setLogs(logsData);
    } catch (error) {
      console.error("Error fetching deletion logs:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.id) {
      fetchLogs();
    }
  }, [user?.id]);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  const renderEntityInfoPreview = (entityData: Record<string, any>, entityType: string) => {
    if (entityType === 'cafe') {
      return (
        <div className="text-sm">
          <p><strong>Name:</strong> {entityData.name || 'N/A'}</p>
          <p><strong>Owner:</strong> {entityData.ownerName || 'N/A'}</p>
          <p><strong>Location:</strong> {entityData.city}, {entityData.governorate}</p>
        </div>
      );
    }
    
    // For other entity types, you can add custom renderers here
    return <div className="text-sm italic">View JSON for details</div>;
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Deletion Logs</CardTitle>
          <CardDescription>History of deleted items</CardDescription>
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
        ) : logs.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No deletion logs found</p>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Deleted At</TableHead>
                  <TableHead>Deleted By</TableHead>
                  <TableHead>Entity Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="capitalize">{log.entity_type}</TableCell>
                    <TableCell>{formatDate(log.deleted_at)}</TableCell>
                    <TableCell>{log.deleted_by}</TableCell>
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

export default DeletionLogs;
