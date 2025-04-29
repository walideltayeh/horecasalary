
import React from 'react';
import { Cafe } from '@/types';
import { Button } from "@/components/ui/button";
import { Check, Clock, Pencil, Trash2 } from 'lucide-react';

interface CafeRowActionsProps {
  cafe: Cafe;
  canEdit: boolean;
  deleteInProgress: string | null;
  handleEdit: (cafe: Cafe) => void;
  handleUpdateStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => Promise<void>;
  openDeleteConfirmation: (cafeId: string, cafeName: string) => void;
}

const CafeRowActions: React.FC<CafeRowActionsProps> = ({
  cafe,
  canEdit,
  deleteInProgress,
  handleEdit,
  handleUpdateStatus,
  openDeleteConfirmation
}) => {
  return (
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
          onClick={() => openDeleteConfirmation(cafe.id, cafe.name)}
          disabled={deleteInProgress !== null} // Disable all delete buttons while any deletion is in progress
        >
          <Trash2 className={`h-3 w-3 ${deleteInProgress === cafe.id ? 'animate-spin' : ''}`} /> 
          {deleteInProgress === cafe.id ? 'Deleting...' : 'Delete'}
        </Button>
      )}
    </div>
  );
};

export default CafeRowActions;
