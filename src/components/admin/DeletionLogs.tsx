
import React, { useState, useEffect } from 'react';
import { useDeleteLogger } from '@/hooks/cafe/useDeleteLogger';
import { DeletionLog } from '@/types';
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Info } from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DeletionLogs: React.FC = () => {
  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<DeletionLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { getDeletionLogs } = useDeleteLogger();
  
  useEffect(() => {
    loadLogs();
  }, []);
  
  const loadLogs = async () => {
    setLoading(true);
    const fetchedLogs = await getDeletionLogs();
    setLogs(fetchedLogs);
    setLoading(false);
  };
  
  const viewDetails = (log: DeletionLog) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };
  
  // Filter logs based on search term and entity type
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.deleted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.entity_data).toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = entityTypeFilter === 'all' || log.entity_type === entityTypeFilter;
    
    return matchesSearch && matchesType;
  });
  
  // Get unique entity types for filtering
  const entityTypes = Array.from(new Set(logs.map(log => log.entity_type)));
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Deletion Logs</h2>
        <Button 
          variant="outline" 
          onClick={loadLogs} 
          disabled={loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
          Refresh
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs 
          value={entityTypeFilter} 
          onValueChange={setEntityTypeFilter}
          className="w-[400px]"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {entityTypes.map(type => (
              <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || entityTypeFilter !== 'all' 
            ? "No matching logs found." 
            : "No deletion logs available."}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Deleted By</TableHead>
                <TableHead>Deleted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline">{log.entity_type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                  <TableCell>{log.deleted_by}</TableCell>
                  <TableCell>
                    {new Date(log.deleted_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => viewDetails(log)}
                      className="flex items-center gap-1"
                    >
                      <Info className="h-4 w-4" /> Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deleted Entity Details</DialogTitle>
            <DialogDescription>
              Details of the deleted {selectedLog?.entity_type} (ID: {selectedLog?.entity_id})
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Entity Type:</div>
              <div>{selectedLog?.entity_type}</div>
              
              <div className="font-medium">Entity ID:</div>
              <div className="font-mono text-xs">{selectedLog?.entity_id}</div>
              
              <div className="font-medium">Deleted By:</div>
              <div>{selectedLog?.deleted_by}</div>
              
              <div className="font-medium">Deleted At:</div>
              <div>{selectedLog?.deleted_at && new Date(selectedLog.deleted_at).toLocaleString()}</div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Entity Data:</h4>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(selectedLog?.entity_data, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeletionLogs;
