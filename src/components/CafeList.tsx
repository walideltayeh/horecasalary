
import React, { useEffect, useState, useRef } from 'react';
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
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleUpdateStatus = (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    updateCafeStatus(cafeId, newStatus);
    toast.success(`Cafe status updated to ${newStatus}`);
  };

  const handleDelete = async (cafeId: string, cafeName: string) => {
    if (window.confirm(`Are you sure you want to delete ${cafeName}?`)) {
      try {
        // Show loading state on button
        setDeleteInProgress(cafeId);
        
        // Show toast
        const loadingToast = toast.loading(`Deleting cafe ${cafeName}...`);
        
        console.log(`UI: Starting deletion of cafe: ${cafeName} (${cafeId})`);
        
        // Set up a timeout to catch hung operations
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Deletion operation timed out'));
          }, 10000); // 10 second timeout
          
          // Store timeout ID so we can clear it
          refreshTimeoutRef.current = timeoutId;
        });
        
        // Race between deletion and timeout
        const result = await Promise.race([
          deleteCafe(cafeId),
          timeoutPromise
        ]);
        
        // Clear the timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        
        // Handle result
        toast.dismiss(loadingToast);
        
        if (result === true) {
          console.log(`UI: Cafe ${cafeName} deleted successfully`);
          toast.success(`Cafe ${cafeName} deleted successfully`);
          
          // Dispatch event to trigger refresh across components
          window.dispatchEvent(new CustomEvent('horeca_data_updated'));
        } else {
          console.error(`UI: Failed to delete cafe ${cafeName}`);
          toast.error(`Failed to delete ${cafeName}`);
          
          // Force refresh to ensure UI is in sync with server
          refreshCafes();
        }
      } catch (error: any) {
        console.error(`UI: Error during deletion:`, error);
        toast.error(`Error: ${error.message || 'Unknown error'}`);
        
        // Force refresh to ensure UI is in sync with server
        refreshCafes();
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
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error during refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };
  
  // Set up listener for data update events
  useEffect(() => {
    const handleDataUpdated = () => {
      console.log("CafeList detected data update event");
      setRefreshing(true);
      refreshCafes().finally(() => setRefreshing(false));
    };
    
    window.addEventListener('horeca_data_updated', handleDataUpdated);
    
    return () => {
      window.removeEventListener('horeca_data_updated', handleDataUpdated);
      
      // Also clear any pending timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshCafes]);
  
  // Log user and filter for debugging
  console.log("CafeList render - Current user:", user);
  console.log("CafeList render - isAdmin:", isAdmin);
  console.log("CafeList render - filterByUser:", filterByUser);
  
  // Log cafes to help debug
  console.log("CafeList render - all cafes:", cafes);
  
  let filteredCafes = cafes;
  
  if (!adminView && filterByUser) {
    console.log(`Filtering cafes by user ID: ${filterByUser}`);
    filteredCafes = cafes.filter(cafe => cafe.createdBy === filterByUser);
    console.log("Filtered cafes:", filteredCafes);
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
              filteredCafes.map((cafe) => {
                // Debug permissions for this specific cafe
                const canEdit = isAdmin || (user && cafe.createdBy === user.id);
                console.log(`Cafe ${cafe.id} permissions - isAdmin: ${isAdmin}, user.id: ${user?.id}, cafe.createdBy: ${cafe.createdBy}, canEdit: ${canEdit}`);
                
                return (
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
                      {canEdit && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => handleEdit(cafe)}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      )}
                    
                      {canEdit && cafe.status === 'Pending' && (
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
                      {canEdit && cafe.status === 'Visited' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 border-green-500 text-green-500 hover:bg-green-50"
                          onClick={() => handleUpdateStatus(cafe.id, 'Contracted')}
                        >
                          <Check className="h-3 w-3" /> Mark Contracted
                        </Button>
                      )}
                      {canEdit && cafe.status === 'Contracted' && (
                        <span className="text-green-500 text-xs">✓ Contracted</span>
                      )}
                      {canEdit && (
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
                          <Trash2 className={`h-3 w-3 ${deleteInProgress === cafe.id ? 'animate-spin' : ''}`} /> 
                          {deleteInProgress === cafe.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )})
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
            // Dispatch event to trigger refresh across components
            window.dispatchEvent(new CustomEvent('horeca_data_updated'));
          }}
        />
      )}
    </div>
  );
};

export default CafeList;
