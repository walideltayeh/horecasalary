
import React from 'react';
import { Cafe } from '@/types';
import { Button } from "@/components/ui/button";
import { Check, Clock, Loader2, Pencil, Trash2 } from 'lucide-react';

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
  // Check if this particular cafe is being deleted
  const isDeleting = deleteInProgress === cafe.id;
  
  // Global deletion state - any cafe is being deleted
  const anyDeletionInProgress = deleteInProgress !== null;
  
  return (
    <div className="flex justify-end gap-2">
      {canEdit && (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => handleEdit(cafe)}
          disabled={isDeleting}
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
            disabled={isDeleting}
          >
            <Clock className="h-3 w-3" /> Mark Visited
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 border-green-500 text-green-500 hover:bg-green-50"
            onClick={() => handleUpdateStatus(cafe.id, 'Contracted')}
            disabled={isDeleting}
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
          disabled={isDeleting}
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
            isDeleting 
              ? 'border-red-300 text-red-400 bg-red-50' 
              : anyDeletionInProgress
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-red-500 text-red-500 hover:bg-red-50'
          }`}
          onClick={() => !isDeleting && !anyDeletionInProgress && openDeleteConfirmation(cafe.id, cafe.name)}
          disabled={anyDeletionInProgress}
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-3 w-3" />
              Delete
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default CafeRowActions;
