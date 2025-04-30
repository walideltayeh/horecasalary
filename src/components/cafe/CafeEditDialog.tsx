
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cafe } from '@/types';
import { PhotoUpload } from './PhotoUpload';
import { CafeBasicEditInfo } from './edit/CafeBasicEditInfo';
import { CafeCapacityEditInfo } from './edit/CafeCapacityEditInfo';
import { CafeLocationEditInfo } from './edit/CafeLocationEditInfo';
import { useEditCafeDialog } from '@/hooks/useEditCafeDialog';
import { Label } from "@/components/ui/label";
import CafeStatusSelect from './CafeStatusSelect';

interface CafeEditDialogProps {
  cafe: Cafe;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CafeEditDialog: React.FC<CafeEditDialogProps> = ({ cafe, isOpen, onClose, onSave }) => {
  const {
    formData,
    isSubmitting,
    availableCities,
    handleInputChange,
    handleSelectChange,
    handleSubmit
  } = useEditCafeDialog(cafe, onClose, onSave);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Cafe</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <CafeBasicEditInfo 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="status">Cafe Status <span className="text-red-500">*</span></Label>
            <CafeStatusSelect
              selectedStatus={formData.status as 'Pending' | 'Visited' | 'Contracted'}
              onSelectChange={handleSelectChange}
            />
          </div>
          
          <CafeCapacityEditInfo 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />
          
          <CafeLocationEditInfo 
            formData={formData} 
            availableCities={availableCities} 
            handleSelectChange={handleSelectChange} 
          />
          
          <div className="grid gap-2">
            <Label>Cafe Photo <span className="text-red-500">*</span></Label>
            <PhotoUpload 
              onPhotoChange={(url) => handleSelectChange('photoUrl', url)}
              initialUrl={formData.photoUrl} 
            />
          </div>

          <div className="text-sm text-gray-500 mt-2">
            <p>Note: GPS location cannot be changed after cafe creation.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CafeEditDialog;
