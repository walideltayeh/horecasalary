
import React, { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CafeFormState } from './cafe/types/CafeFormTypes';
import { useLanguage } from '@/contexts/LanguageContext';

interface CafeBrandSurveyProps {
  cafeFormData: CafeFormState & { createdBy: string; latitude: number; longitude: number; status: string };
  onComplete: (brandSales: any[]) => void;
  onCancel?: () => void;
}

interface BrandSale {
  brand: 'Al Fakher' | 'Adalya' | 'Fumari' | 'Star Buzz';
  packsPerWeek: number;
}

const BRANDS = ['Al Fakher', 'Adalya', 'Fumari', 'Star Buzz'] as const;

export const CafeBrandSurvey: React.FC<CafeBrandSurveyProps> = ({ 
  cafeFormData,
  onComplete, 
  onCancel 
}) => {
  const { t } = useLanguage();
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [brandSales, setBrandSales] = useState<BrandSale[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBrandToggle = (brand: string) => {
    const newSelectedBrands = new Set(selectedBrands);
    if (newSelectedBrands.has(brand)) {
      newSelectedBrands.delete(brand);
      setBrandSales(brandSales.filter(sale => sale.brand !== brand));
    } else {
      newSelectedBrands.add(brand);
      setBrandSales([...brandSales, { brand: brand as any, packsPerWeek: 0 }]);
    }
    setSelectedBrands(newSelectedBrands);
  };

  const handlePacksChange = (brand: string, packs: number) => {
    setBrandSales(brandSales.map(sale => 
      sale.brand === brand ? { ...sale, packsPerWeek: packs } : sale
    ));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (selectedBrands.size === 0) {
        toast.error('Please select at least one brand');
        return;
      }
      
      onComplete(brandSales);
      toast.success('Survey completed!');
    } catch (error: any) {
      console.error('Error in survey:', error);
      toast.error(error.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <CardHeader>
        <CardTitle>{t('survey.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">{t('survey.select.brands')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {BRANDS.map(brand => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={selectedBrands.has(brand)}
                    onCheckedChange={() => handleBrandToggle(brand)}
                  />
                  <Label htmlFor={brand}>{brand}</Label>
                </div>
              ))}
            </div>
          </div>

          {selectedBrands.size > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t('survey.weekly.sales')}</h3>
              {brandSales.map(sale => (
                <div key={sale.brand} className="flex items-center gap-4">
                  <Label htmlFor={`packs-${sale.brand}`} className="w-32">{sale.brand}:</Label>
                  <Input
                    id={`packs-${sale.brand}`}
                    type="number"
                    min="0"
                    value={sale.packsPerWeek}
                    onChange={(e) => handlePacksChange(sale.brand, parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">{t('survey.packs.per.week')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || selectedBrands.size === 0}
            className="flex-1"
          >
            {isSubmitting ? t('survey.submitting') : t('survey.submit')}
          </Button>
          
          {onCancel && (
            <Button 
              onClick={onCancel}
              variant="outline"
              disabled={isSubmitting}
              className="flex-1"
            >
              {t('survey.cancel')}
            </Button>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default CafeBrandSurvey;
