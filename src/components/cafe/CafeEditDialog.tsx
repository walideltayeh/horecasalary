
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
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeEditDialogProps {
  cafe: Cafe;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CafeEditDialog: React.FC<CafeEditDialogProps> = ({ cafe, isOpen, onClose, onSave }) => {
  const { t } = useLanguage();
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('button.edit')} {cafe.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <CafeBasicEditInfo 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="status">{t('cafe.status')} <span className="text-red-500">*</span></Label>
            <CafeStatusSelect
              selectedStatus={formData.status as 'Pending' | 'Visited' | 'Contracted'}
              onSelectChange={handleSelectChange}
              numberOfHookahs={formData.numberOfHookahs}
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
            <Label>{t('cafe.photo')} <span className="text-red-500">*</span></Label>
            <PhotoUpload 
              onPhotoChange={(url) => handleSelectChange('photoUrl', url)}
              initialUrl={formData.photoUrl} 
            />
          </div>

          <div className="text-sm text-gray-500 mt-2">
            <p>{t('cafe.gps.note')}</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('button.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('cafe.saving') : t('button.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CafeEditDialog;
