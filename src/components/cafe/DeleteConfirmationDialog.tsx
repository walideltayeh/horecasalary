
import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  cafeToDelete: {id: string, name: string} | null;
  deleteInProgress: string | null;
  handleDelete: () => Promise<void>;
  closeDeleteConfirmation: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  cafeToDelete,
  deleteInProgress,
  handleDelete,
  closeDeleteConfirmation
}) => {
  // Check if this specific cafe is being deleted
  const isDeleting = cafeToDelete && deleteInProgress === cafeToDelete.id;
  
  return (
    <AlertDialog open={cafeToDelete !== null} onOpenChange={(isOpen) => {
      if (!isOpen && !isDeleting) closeDeleteConfirmation();
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {cafeToDelete?.name} and all associated data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className={`bg-red-500 text-white hover:bg-red-600 ${isDeleting ? 'opacity-80' : ''}`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
