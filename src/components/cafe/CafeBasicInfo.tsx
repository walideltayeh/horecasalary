
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CafeStatusSelect from './CafeStatusSelect';
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeBasicInfoProps {
  formState: {
    name: string;
    ownerName: string;
    ownerNumber: string;
    status: 'Pending' | 'Visited' | 'Contracted';
    numberOfHookahs?: number;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStatusChange: (name: string, value: string) => void;
}

const CafeBasicInfo: React.FC<CafeBasicInfoProps> = ({ formState, handleInputChange, handleStatusChange }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">{t('cafe.form.cafe.name')} <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            name="name"
            placeholder={t('cafe.form.cafe.name')}
            value={formState.name}
            onChange={handleInputChange}
            className="border-red-500"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="ownerName">{t('cafe.form.owner.name')} <span className="text-red-500">*</span></Label>
          <Input
            id="ownerName"
            name="ownerName"
            placeholder={t('cafe.form.owner.name')}
            value={formState.ownerName}
            onChange={handleInputChange}
            className="border-red-500"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ownerNumber">{t('cafe.form.owner.phone')} <span className="text-red-500">*</span></Label>
            <Input
              id="ownerNumber"
              name="ownerNumber"
              placeholder={t('cafe.form.owner.phone')}
              value={formState.ownerNumber}
              onChange={handleInputChange}
              className="border-red-500"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status">{t('cafe.form.cafe.status')} <span className="text-red-500">*</span></Label>
            <CafeStatusSelect
              selectedStatus={formState.status}
              onSelectChange={handleStatusChange}
              numberOfHookahs={formState.numberOfHookahs || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CafeBasicInfo;
