
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Check, Clock, Pencil, RefreshCcw, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { refreshCafeData } from '@/integrations/supabase/client';
import ExportToExcel from './admin/ExportToExcel';
import CafeEditDialog from './cafe/CafeEditDialog';
import { Cafe } from '@/types';

interface CafeListProps {
  adminView?: boolean;
  filterByUser?: string;
}

const CafeList: React.FC<CafeListProps> = ({ adminView = false, filterByUser }) => {
  const { cafes, getCafeSize, updateCafeStatus, deleteCafe, refreshCafes, loading } = useData();
  const { user, isAdmin } = useAuth();
  const [cafeToEdit, setCafeToEdit] = useState<Cafe | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Track render counts to help debug
  const renderCount = React.useRef(0);
  renderCount.current++;
  
  const handleUpdateStatus = (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    updateCafeStatus(cafeId, newStatus);
    toast.success(`Cafe status updated to ${newStatus}`);
  };

  const handleDelete = async (cafeId: string, cafeName: string) => {
    if (window.confirm(`Are you sure you want to delete ${cafeName}?`)) {
      const success = await deleteCafe(cafeId);
      if (success) {
        toast.success(`Cafe ${cafeName} deleted successfully`);
        refreshCafeData(); // Force refresh after delete
        refreshCafes();
      } else {
        toast.error(`Failed to delete ${cafeName}`);
      }
    }
  };
  
  const handleEdit = (cafe: Cafe) => {
    setCafeToEdit(cafe);
    setShowEditDialog(true);
  };
  
  const handleRefresh = async () => {
    toast.info("Refreshing cafe data from server...");
    // Trigger both local and global refresh
    await refreshCafes();
    refreshCafeData();
  };
  
  // Reduce refresh frequency for better performance
  useEffect(() => {
    // Force immediate refresh on mount
    console.log("CafeList mounted, forcing data refresh");
    handleRefresh();
    
    // Set different refresh intervals for admin vs regular view
    const refreshInterval = adminView ? 40000 : 120000; // 40 seconds for admin, 2 minutes for regular users
    
    const refreshTimer = setInterval(() => {
      console.log(`Automatic refresh timer triggered in CafeList (${adminView ? 'admin view' : 'user view'})`);
      refreshCafes();
    }, refreshInterval);
    
    return () => {
      clearInterval(refreshTimer);
    };
  }, [refreshCafes, adminView]);
  
  // Filter cafes based on adminView - if admin, show all cafes; if user, filter by user ID
  const filteredCafes = adminView 
    ? cafes // Show all cafes in admin view
    : filterByUser 
      ? cafes.filter(cafe => cafe.createdBy === filterByUser)
      : cafes;
  
  console.log(`CafeList render #${renderCount.current} with ${filteredCafes.length} cafes, loading: ${loading}, isAdmin: ${isAdmin}, adminView: ${adminView}`);
  console.log("Total cafes in context:", cafes.length);
  
  if (filterByUser && !adminView) {
    console.log("Filtering by user:", filterByUser);
  }
    
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-2">
        <div>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading cafe data...</p>
          ) : (
            <p className="text-gray-500 text-sm">{filteredCafes.length} cafes found {adminView ? '(Admin view)' : ''}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ExportToExcel cafes={filteredCafes} />
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
                      {/* Edit button for both admin and cafe creator */}
                      {(isAdmin || cafe.createdBy === user?.id) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => handleEdit(cafe)}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      )}
                    
                      {/* Status update buttons */}
                      {(isAdmin || cafe.createdBy === user?.id) && cafe.status === 'Pending' && (
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
                      {(isAdmin || cafe.createdBy === user?.id) && cafe.status === 'Visited' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 border-green-500 text-green-500 hover:bg-green-50"
                          onClick={() => handleUpdateStatus(cafe.id, 'Contracted')}
                        >
                          <Check className="h-3 w-3" /> Mark Contracted
                        </Button>
                      )}
                      {(isAdmin || cafe.createdBy === user?.id) && cafe.status === 'Contracted' && (
                        <span className="text-green-500 text-xs">✓ Contracted</span>
                      )}
                      {/* Delete button - only for admin or cafe creator */}
                      {(isAdmin || cafe.createdBy === user?.id) && (
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
      
      {/* Edit dialog */}
      {cafeToEdit && (
        <CafeEditDialog 
          cafe={cafeToEdit} 
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setCafeToEdit(null);
          }}
          onSave={() => {
            setShowEditDialog(false);
            setCafeToEdit(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
};

export default CafeList;
