
import React, { useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Check, Clock, RefreshCcw, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CafeListProps {
  adminView?: boolean;
  filterByUser?: string;
}

const CafeList: React.FC<CafeListProps> = ({ adminView = false, filterByUser }) => {
  const { cafes, getCafeSize, updateCafeStatus, deleteCafe, refreshCafes, loading } = useData();
  const { user, isAdmin } = useAuth();
  
  const handleUpdateStatus = (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    updateCafeStatus(cafeId, newStatus);
    toast.success(`Cafe status updated to ${newStatus}`);
  };

  const handleDelete = (cafeId: string, cafeName: string) => {
    if (window.confirm(`Are you sure you want to delete ${cafeName}?`)) {
      deleteCafe(cafeId);
    }
  };
  
  const handleRefresh = () => {
    refreshCafes();
    toast.success("Refreshing cafe data from server...");
  };
  
  // Set up periodic refresh
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      console.log("Automatic refresh timer triggered in CafeList");
      refreshCafes();
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(refreshTimer);
    };
  }, [refreshCafes]);
  
  useEffect(() => {
    // Force a refresh when the component mounts
    console.log("CafeList mounted, forcing data refresh");
    refreshCafes();
  }, [refreshCafes]);
  
  // Filter cafes based on filterByUser if provided
  const filteredCafes = filterByUser 
    ? cafes.filter(cafe => cafe.createdBy === filterByUser)
    : cafes;
  
  console.log("CafeList rendering with", filteredCafes.length, "cafes, loading:", loading);
  console.log("Total cafes in context:", cafes.length);
  if (filterByUser) {
    console.log("Filtering by user:", filterByUser);
  }
    
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              {adminView && <TableHead>Created By</TableHead>}
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array(3).fill(0).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  {adminView && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredCafes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={adminView ? 8 : 7} className="text-center py-4 text-muted-foreground">
                  No cafes found. {!adminView && "Add some cafes to see them here."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCafes.map((cafe) => (
                <TableRow key={cafe.id}>
                  <TableCell className="font-medium">{cafe.name}</TableCell>
                  <TableCell>
                    <span className={getCafeSize(cafe.numberOfHookahs) === 'In Negotiation' ? 'text-orange-500' : 
                                    getCafeSize(cafe.numberOfHookahs) === 'Small' ? 'text-blue-500' : 
                                    getCafeSize(cafe.numberOfHookahs) === 'Medium' ? 'text-green-500' : 
                                    'text-purple-500'}>
                      {getCafeSize(cafe.numberOfHookahs)}
                    </span>
                  </TableCell>
                  <TableCell>{cafe.governorate}, {cafe.city}</TableCell>
                  <TableCell>
                    <span className={cafe.status === 'Contracted' ? 'text-green-500' : 
                                    cafe.status === 'Visited' ? 'text-blue-500' : 
                                    'text-gray-500'}>
                      {cafe.status}
                    </span>
                  </TableCell>
                  <TableCell>{cafe.ownerName}</TableCell>
                  {adminView && <TableCell>{cafe.createdBy}</TableCell>}
                  <TableCell>{new Date(cafe.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!adminView && cafe.status === 'Pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1 border-blue-500 text-blue-500 hover:bg-blue-50"
                            onClick={() => handleUpdateStatus(cafe.id, 'Visited')}
                          >
                            <Clock className="h-3 w-3" /> Mark Visited
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1 border-green-500 text-green-500 hover:bg-green-50"
                            onClick={() => handleUpdateStatus(cafe.id, 'Contracted')}
                          >
                            <Check className="h-3 w-3" /> Mark Contracted
                          </Button>
                        </>
                      )}
                      {!adminView && cafe.status === 'Visited' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 border-green-500 text-green-500 hover:bg-green-50"
                          onClick={() => handleUpdateStatus(cafe.id, 'Contracted')}
                        >
                          <Check className="h-3 w-3" /> Mark Contracted
                        </Button>
                      )}
                      {!adminView && cafe.status === 'Contracted' && (
                        <span className="text-green-500 text-xs">✓ Contracted</span>
                      )}
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(cafe.id, cafe.name)}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CafeList;
