
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeCapacityEditInfoProps {
  formData: {
    numberOfHookahs: number;
    numberOfTables: number;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CafeCapacityEditInfo: React.FC<CafeCapacityEditInfoProps> = ({ 
  formData, 
  handleInputChange 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="numberOfHookahs">{t('cafe.form.hookahs')}</Label>
        <Input
          id="numberOfHookahs"
          name="numberOfHookahs"
          type="number"
          value={formData.numberOfHookahs}
          onChange={handleInputChange}
          min={0}
          aria-label={t('cafe.form.hookahs')}
          className="focus:border-blue-500"
        />
        <div className="text-xs text-gray-500">
          {t('cafe.form.size.current')}
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="numberOfTables">{t('cafe.form.tables')}</Label>
        <Input
          id="numberOfTables"
          name="numberOfTables"
          type="number"
          value={formData.numberOfTables}
          onChange={handleInputChange}
          min={0}
          aria-label={t('cafe.form.tables')}
          className="focus:border-blue-500"
        />
      </div>
    </div>
  );
};
