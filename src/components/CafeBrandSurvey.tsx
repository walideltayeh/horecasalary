
import React, { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';

interface CafeBrandSurveyProps {
  onComplete: () => void;
  cafeId?: string; // Make this prop optional to maintain compatibility
}

interface BrandSale {
  brand: 'Al Fakher' | 'Adalya' | 'Fumari' | 'Star Buzz';
  packsPerWeek: number;
}

const BRANDS = ['Al Fakher', 'Adalya', 'Fumari', 'Star Buzz'] as const;

export const CafeBrandSurvey: React.FC<CafeBrandSurveyProps> = ({ onComplete, cafeId }) => {
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
      
      if (!cafeId) {
        toast.error('No cafe specified for this survey');
        return;
      }

      // Insert a new cafe survey
      const { data: surveyData, error: surveyError } = await supabase
        .from('cafe_surveys')
        .insert({ cafe_id: cafeId })
        .select('id')
        .single();

      if (surveyError) throw surveyError;

      if (surveyData) {
        // Insert brand sales data
        const brandSalesData = brandSales.map(sale => ({
          survey_id: surveyData.id,
          brand: sale.brand,
          packs_per_week: sale.packsPerWeek
        }));

        const { error: brandError } = await supabase
          .from('brand_sales')
          .insert(brandSalesData);

        if (brandError) throw brandError;
        
        toast.success('Survey completed successfully!');
        onComplete();
      }
    } catch (error: any) {
      console.error('Error in survey:', error);
      toast.error(error.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Brand Sales Survey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Select brands sold in this cafe:</h3>
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
              <h3 className="text-sm font-medium">Weekly sales per brand:</h3>
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
                  <span className="text-sm text-gray-500">packs per week</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || selectedBrands.size === 0}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Survey'}
        </Button>
      </CardContent>
    </>
  );
};

export default CafeBrandSurvey;
