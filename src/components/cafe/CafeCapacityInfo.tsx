
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CafeFormProps } from './types/CafeFormTypes';
import { useLanguage } from '@/contexts/LanguageContext';

export const CafeCapacityInfo = ({ 
  formState, 
  onInputChange,
  cafeSize 
}: Pick<CafeFormProps, 'formState' | 'onInputChange' | 'cafeSize'>) => {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="numberOfHookahs">
          {t('cafe.form.hookahs')} <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="numberOfHookahs" 
          name="numberOfHookahs"
          type="number"
          min="0"
          value={formState.numberOfHookahs}
          onChange={onInputChange}
          className="input-with-red-outline"
          required
        />
        <div className="mt-2">
          <div>{t('cafe.form.size.current')}: <span className="cafe-size-value">{cafeSize}</span></div>
          <div className="cafe-size-legend">
            {t('cafe.form.size.legend')}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="numberOfTables">
          {t('cafe.form.tables')} <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="numberOfTables" 
          name="numberOfTables"
          type="number"
          min="0"
          value={formState.numberOfTables}
          onChange={onInputChange}
          className="input-with-red-outline"
          required
        />
      </div>
    </div>
  );
};
