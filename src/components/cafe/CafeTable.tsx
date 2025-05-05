
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cafe } from '@/types';
import CafeTableRow from './CafeTableRow';
import CafeTableSkeleton from './CafeTableSkeleton';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  
  // Count cafes by size and status
  const sizeCounts = {
    small: filteredCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length,
    medium: filteredCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length,
    large: filteredCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('cafe.name')}</TableHead>
            <TableHead>{t('cafe.size')}</TableHead>
            <TableHead>{t('cafe.location')}</TableHead>
            <TableHead>{t('cafe.status')}</TableHead>
            <TableHead>{t('cafe.owner')}</TableHead>
            {adminView && <TableHead>{t('cafe.created.by')}</TableHead>}
            <TableHead>{t('cafe.date.added')}</TableHead>
            <TableHead className="text-right">{t('cafe.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <CafeTableSkeleton adminView={adminView} />
          ) : filteredCafes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={adminView ? 8 : 7} className="text-center py-4 text-muted-foreground">
                {t('cafe.no.cafes')}
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
