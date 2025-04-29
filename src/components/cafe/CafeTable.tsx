
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cafe } from '@/types';
import CafeTableRow from './CafeTableRow';
import CafeTableSkeleton from './CafeTableSkeleton';

interface CafeTableProps {
  filteredCafes: Cafe[];
  adminView: boolean;
  loading: boolean;
  isAdmin: boolean;
  user: any;
  deleteInProgress: string | null;
  getCafeSize: any;
  handleEdit: (cafe: Cafe) => void;
  handleUpdateStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => Promise<void>;
  openDeleteConfirmation: (cafeId: string, cafeName: string) => void;
}

const CafeTable: React.FC<CafeTableProps> = ({
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
}) => {
  return (
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
            <CafeTableSkeleton adminView={adminView} />
          ) : filteredCafes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={adminView ? 8 : 7} className="text-center py-4 text-muted-foreground">
                No cafes found. {!adminView && "Add some cafes to see them here."}
              </TableCell>
            </TableRow>
          ) : (
            filteredCafes.map((cafe) => {
              // Improve permission checking
              const canEdit = Boolean(
                isAdmin || 
                (user && cafe.createdBy === user.id)
              );
              
              return (
                <CafeTableRow
                  key={cafe.id}
                  cafe={cafe}
                  adminView={adminView}
                  deleteInProgress={deleteInProgress}
                  canEdit={canEdit}
                  getCafeSize={getCafeSize}
                  handleEdit={handleEdit}
                  handleUpdateStatus={handleUpdateStatus}
                  openDeleteConfirmation={openDeleteConfirmation}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CafeTable;
