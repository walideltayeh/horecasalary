
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
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  const [deleteAttempted, setDeleteAttempted] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const renderCount = React.useRef(0);
  renderCount.current++;
  
  const handleUpdateStatus = (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    updateCafeStatus(cafeId, newStatus);
    toast.success(`Cafe status updated to ${newStatus}`);
  };

  const handleDelete = async (cafeId: string, cafeName: string) => {
    if (window.confirm(`Are you sure you want to delete ${cafeName}?`)) {
      try {
        // Track that we've attempted a delete
        setDeleteAttempted(true);
        
        // Show loading state on button
        setDeleteInProgress(cafeId);
        
        // Show toast
        const loadingToast = toast.loading(`Deleting cafe ${cafeName}...`);
        
        console.log(`DELETION UI: Attempting to delete cafe: ${cafeName} (${cafeId})`);
        
        // Attempt deletion
        const success = await deleteCafe(cafeId);
        
        // Handle success/failure
        if (success) {
          // Clear the loading toast
          toast.dismiss(loadingToast);
          toast.success(`Cafe ${cafeName} deleted successfully`);
          
          console.log("DELETION UI: Success, triggering data refresh sequence");
          
          // Trigger aggressive refresh sequence
          setRefreshing(true);
          
          // 1. First refresh
          refreshCafeData();
          
          // 2. Immediate refresh via context
          await refreshCafes();
          
          // 3. Update local state as a fallback
          // This ensures UI updates even if context refresh fails
          setTimeout(() => {
            console.log("DELETION UI: Fallback refresh to ensure UI consistency");
            refreshCafes().finally(() => {
              setRefreshing(false);
            });
          }, 1000);
        } else {
          // Clear the loading toast
          toast.dismiss(loadingToast);
          toast.error(`Failed to delete ${cafeName}`);
        }
      } catch (error) {
        console.error("DELETION UI: Exception occurred:", error);
        toast.error(`Error deleting ${cafeName}`);
      } finally {
        // Always clear loading state
        setDeleteInProgress(null);
      }
    }
  };
  
  const handleEdit = (cafe: Cafe) => {
    setCafeToEdit(cafe);
    setShowEditDialog(true);
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info("Refreshing cafe data from server...");
    
    try {
      await refreshCafes();
      refreshCafeData();
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error during refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    console.log("CafeList mounted, forcing data refresh");
    handleRefresh();
    
    const refreshInterval = adminView ? 40000 : 120000;
    const refreshTimer = setInterval(() => {
      console.log(`Automatic refresh timer triggered in CafeList (${adminView ? 'admin view' : 'user view'})`);
      refreshCafes();
    }, refreshInterval);
    
    return () => {
      clearInterval(refreshTimer);
    };
  }, [refreshCafes, adminView]);
  
  // Special effect to handle post-deletion refreshes
  useEffect(() => {
    if (deleteAttempted && !deleteInProgress) {
      console.log("DELETION UI: Delete operation completed, checking data consistency");
      
      // One final refresh after any delete operation completes
      const finalCheckTimer = setTimeout(() => {
        refreshCafes();
        setDeleteAttempted(false);
      }, 2000);
      
      return () => clearTimeout(finalCheckTimer);
    }
  }, [deleteAttempted, deleteInProgress, refreshCafes]);
  
  const filteredCafes = adminView 
    ? cafes
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
            disabled={loading || refreshing}
          >
            <RefreshCcw className={`h-3 w-3 ${loading || refreshing ? 'animate-spin' : ''}`} /> 
            {loading || refreshing ? 'Refreshing...' : 'Refresh Data'}
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
                      {(isAdmin || cafe.createdBy === user?.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex items-center gap-1 ${
                            deleteInProgress === cafe.id 
                              ? 'border-gray-300 text-gray-400' 
                              : 'border-red-500 text-red-500 hover:bg-red-50'
                          }`}
                          onClick={() => handleDelete(cafe.id, cafe.name)}
                          disabled={deleteInProgress !== null} // Disable all delete buttons while any deletion is in progress
                        >
                          <Trash2 className="h-3 w-3" /> 
                          {deleteInProgress === cafe.id ? 'Deleting...' : 'Delete'}
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
