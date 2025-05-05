
import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CafeEditDialog from './cafe/CafeEditDialog';
import CafeTableActions from './cafe/CafeTableActions';
import CafeTable from './cafe/CafeTable';
import DeleteConfirmationDialog from './cafe/DeleteConfirmationDialog';
import { useCafeListState } from '@/hooks/cafe/useCafeListState';

interface CafeListProps {
  adminView?: boolean;
  filterByUser?: string;
}

const CafeList: React.FC<CafeListProps> = ({ adminView = false, filterByUser }) => {
  const { user, isAdmin } = useAuth();
  const {
    loading,
    refreshing,
    filteredCafes,
    cafeToEdit,
    showEditDialog,
    deleteInProgress,
    cafeToDelete,
    getCafeSize,
    handleEdit,
    handleUpdateStatus,
    handleRefresh,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    handleDelete,
    setShowEditDialog,
    setCafeToEdit
  } = useCafeListState(filterByUser, adminView);
  
  // Memoize component props to reduce re-renders
  const cafeTableProps = useMemo(() => ({
    filteredCafes,
    adminView,
    loading,
    isAdmin,
    user,
    deleteInProgress,
    getCafeSize,
    handleEdit,
    handleUpdateStatus,
    openDeleteConfirmation
  }), [
    filteredCafes,
    adminView,
    loading,
    isAdmin,
    user,
    deleteInProgress,
    getCafeSize,
    handleEdit,
    handleUpdateStatus,
    openDeleteConfirmation
  ]);
  
  // Memoize the dialog handler to prevent re-renders
  const handleDialogClose = useMemo(() => () => {
    setShowEditDialog(false);
    setCafeToEdit(null);
  }, [setShowEditDialog, setCafeToEdit]);
  
  // Memoize the save handler to prevent re-renders
  const handleDialogSave = useMemo(() => () => {
    setShowEditDialog(false);
    setCafeToEdit(null);
    // Dispatch event to trigger refresh across components
    window.dispatchEvent(new CustomEvent('horeca_data_updated'));
  }, [setShowEditDialog, setCafeToEdit]);
  
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
        <CafeTableActions 
          loading={loading} 
          refreshing={refreshing} 
          filteredCafes={filteredCafes}
          handleRefresh={handleRefresh}
        />
      </div>
      
      {/* Use memoized props */}
      <CafeTable {...cafeTableProps} />
      
      {cafeToEdit && (
        <CafeEditDialog 
          cafe={cafeToEdit} 
          isOpen={showEditDialog}
          onClose={handleDialogClose}
          onSave={handleDialogSave}
        />
      )}

      <DeleteConfirmationDialog 
        cafeToDelete={cafeToDelete}
        deleteInProgress={deleteInProgress}
        handleDelete={handleDelete}
        closeDeleteConfirmation={closeDeleteConfirmation}
      />
    </div>
  );
};

export default React.memo(CafeList);
