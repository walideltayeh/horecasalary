
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrandSale {
  id: string;
  brand: string;
  packsPerWeek: number;
  surveyId: string;
  createdAt: string;
}

interface CafeSurvey {
  id: string;
  cafeId: string;
  createdAt: string;
  brandSales: BrandSale[];
}

export const useCafeSurveys = () => {
  const [loading, setLoading] = useState(false);
  const [cafeSurveys, setCafeSurveys] = useState<Record<string, BrandSale[]>>({});

  const fetchAllSurveys = useCallback(async () => {
    setLoading(true);
    try {
      // First get all surveys
      const { data: surveys, error: surveysError } = await supabase
        .from('cafe_surveys')
        .select('*');

      if (surveysError) throw surveysError;

      // Then get all brand sales
      const { data: brandSales, error: brandSalesError } = await supabase
        .from('brand_sales')
        .select('*');

      if (brandSalesError) throw brandSalesError;

      // Organize by cafe_id
      const surveyMap: Record<string, BrandSale[]> = {};
      
      if (surveys && brandSales) {
        surveys.forEach(survey => {
          const cafeSurveyBrands = brandSales.filter(bs => bs.survey_id === survey.id);
          
          if (cafeSurveyBrands.length > 0) {
            const formattedBrands = cafeSurveyBrands.map(bs => ({
              id: bs.id,
              brand: bs.brand,
              packsPerWeek: bs.packs_per_week,
              surveyId: bs.survey_id,
              createdAt: bs.created_at
            }));
            
            surveyMap[survey.cafe_id] = formattedBrands;
          }
        });
      }

      setCafeSurveys(surveyMap);
      return surveyMap;
    } catch (error: any) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to load survey data');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSurveys();
  }, [fetchAllSurveys]);

  return {
    cafeSurveys,
    loading,
    fetchAllSurveys
  };
};
