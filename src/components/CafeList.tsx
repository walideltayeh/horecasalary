
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CafeEditDialog from './cafe/CafeEditDialog';
import CafeTableActions from './cafe/CafeTableActions';
import CafeTable from './cafe/CafeTable';
import DeleteConfirmationDialog from './cafe/DeleteConfirmationDialog';
import { useCafeListState } from '@/hooks/cafe/useCafeListState';
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeListProps {
  adminView?: boolean;
  filterByUser?: string;
}

const CafeList: React.FC<CafeListProps> = ({ adminView = false, filterByUser }) => {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
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
  
  // URGENT FIX: Enhanced logging for debugging
  console.log("URGENT FIX - CafeList render:", {
    totalCafes: filteredCafes.length,
    filterByUser,
    adminView,
    loading,
    refreshing,
    userRole: user?.role,
    isAdmin
  });
  
  if (filterByUser) {
    console.log("URGENT FIX - Filtering by user:", filterByUser);
    console.log("URGENT FIX - Filtered cafes for user:", filteredCafes.map(c => ({
      id: c.id,
      name: c.name,
      createdBy: c.createdBy,
      status: c.status
    })));
  }
  
  // URGENT FIX: Show meaningful loading and error states
  if (loading && filteredCafes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading cafes from database...</p>
          <div className="mt-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-red mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-2">
        <div>
          {loading && filteredCafes.length === 0 ? (
            <p className="text-gray-500 text-sm">Loading cafes...</p>
          ) : (
            <p className="text-gray-500 text-sm">
              {filteredCafes.length} {t('cafe.found')} 
              {adminView ? ' (Admin view)' : ''}
              {filterByUser ? ` (User: ${filterByUser})` : ''}
            </p>
          )}
        </div>
        <CafeTableActions 
          loading={loading} 
          refreshing={refreshing} 
          filteredCafes={filteredCafes}
          handleRefresh={handleRefresh}
        />
      </div>
      
      <CafeTable 
        filteredCafes={filteredCafes}
        adminView={adminView}
        loading={loading}
        isAdmin={isAdmin}
        user={user}
        deleteInProgress={deleteInProgress}
        getCafeSize={getCafeSize}
        handleEdit={handleEdit}
        handleUpdateStatus={handleUpdateStatus}
        openDeleteConfirmation={openDeleteConfirmation}
      />
      
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
            window.dispatchEvent(new CustomEvent('horeca_data_updated', {
              detail: { action: 'cafeUpdated', forceRefresh: true }
            }));
          }}
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

export default CafeList;
