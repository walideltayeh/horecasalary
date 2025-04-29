
import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  return (
    <AlertDialog open={cafeToDelete !== null} onOpenChange={(isOpen) => {
      if (!isOpen) closeDeleteConfirmation();
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {cafeToDelete?.name} and all associated data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteInProgress !== null}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteInProgress !== null}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {deleteInProgress ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
