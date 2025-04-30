
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Cafe, CafeSize } from '@/types';
import CafeSizeBadge from './CafeSizeBadge';
import CafeStatusBadge from './CafeStatusBadge';
import CafeRowActions from './CafeRowActions';
import { Check, Clock, FileText } from 'lucide-react';

interface CafeTableRowProps {
  cafe: Cafe;
  adminView: boolean;
  deleteInProgress: string | null;
  canEdit: boolean;
  getCafeSize: (numberOfHookahs: number) => CafeSize;
  handleEdit: (cafe: Cafe) => void;
  handleUpdateStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => Promise<void>;
  openDeleteConfirmation: (cafeId: string, cafeName: string) => void;
}

const CafeTableRow: React.FC<CafeTableRowProps> = ({
  cafe,
  adminView,
  deleteInProgress,
  canEdit,
  getCafeSize,
  handleEdit,
  handleUpdateStatus,
  openDeleteConfirmation
}) => {
  return (
    <TableRow key={cafe.id} className={deleteInProgress === cafe.id ? 'opacity-50' : ''}>
      <TableCell className="font-medium">{cafe.name}</TableCell>
      <TableCell>
        <CafeSizeBadge cafeSize={getCafeSize(cafe.numberOfHookahs)} />
      </TableCell>
      <TableCell>{cafe.governorate}, {cafe.city}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {cafe.status === 'Contracted' && (
            <FileText className="h-3 w-3 text-green-600" />
          )}
          {cafe.status === 'Visited' && (
            <Check className="h-3 w-3 text-blue-600" />
          )}
          {cafe.status === 'Pending' && (
            <Clock className="h-3 w-3 text-gray-600" />
          )}
          <CafeStatusBadge status={cafe.status} numberOfHookahs={cafe.numberOfHookahs} />
        </div>
      </TableCell>
      <TableCell>{cafe.ownerName}</TableCell>
      {adminView && <TableCell>{cafe.createdBy}</TableCell>}
      <TableCell>{new Date(cafe.createdAt).toLocaleDateString()}</TableCell>
      <TableCell className="text-right">
        <CafeRowActions
          cafe={cafe}
          canEdit={canEdit}
          deleteInProgress={deleteInProgress}
          handleEdit={handleEdit}
          handleUpdateStatus={handleUpdateStatus}
          openDeleteConfirmation={openDeleteConfirmation}
        />
      </TableCell>
    </TableRow>
  );
};

export default CafeTableRow;
