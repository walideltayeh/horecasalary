
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeBasicEditInfoProps {
  formData: {
    name: string;
    ownerName: string;
    ownerNumber: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CafeBasicEditInfo: React.FC<CafeBasicEditInfoProps> = ({ 
  formData, 
  handleInputChange 
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="name">{t('cafe.form.cafe.name')}</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder={t('cafe.form.cafe.name')}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="ownerName">{t('cafe.form.owner.name')}</Label>
        <Input
          id="ownerName"
          name="ownerName"
          value={formData.ownerName}
          onChange={handleInputChange}
          placeholder={t('cafe.form.owner.name')}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="ownerNumber">{t('cafe.form.owner.phone')}</Label>
        <Input
          id="ownerNumber"
          name="ownerNumber"
          value={formData.ownerNumber}
          onChange={handleInputChange}
          placeholder={t('cafe.form.owner.phone')}
        />
      </div>
    </>
  );
};
