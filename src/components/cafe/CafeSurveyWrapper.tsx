
import React, { useState, useCallback } from 'react';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import AddCafeForm from './AddCafeForm';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useCafes } from '@/contexts/CafeContext';
import { supabase } from '@/integrations/supabase/client';

const CafeSurveyWrapper: React.FC = () => {
  const { addCafe } = useCafes();
  const [showSurvey, setShowSurvey] = useState(false);
  const [newCafeId, setNewCafeId] = useState<string | null>(null);
  const [pendingCafeData, setPendingCafeData] = useState<any>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  // Trigger survey when hookah count is 1 or more
  const handleCafePreSubmit = async (cafeData: any) => {
    // Check if survey is needed (number of hookahs ≥ 1)
    if (cafeData.numberOfHookahs >= 1) {
      // Store the cafe data temporarily and show survey
      setPendingCafeData(cafeData);
      setShowSurvey(true);
      setSurveyCompleted(false);
      return false; // Prevent form submission
    }
    
    // If no survey needed, proceed with direct cafe addition
    return true;
  };

  const handleSurveyComplete = async (brandSales: any[]) => {
    try {
      if (pendingCafeData && brandSales.length > 0) {
        // Save cafe data and survey data
        const savedCafeId = await addCafe(pendingCafeData);
        
        if (savedCafeId) {
          // Save survey data to Supabase
          const { data: surveyData, error: surveyError } = await supabase
            .from('cafe_surveys')
            .insert({ cafe_id: savedCafeId })
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
          }

          // Reset states
          setNewCafeId(savedCafeId);
          setPendingCafeData(null);
          setShowSurvey(false);
          setSurveyCompleted(true);

          toast.success(`Cafe "${pendingCafeData.name}" added with survey data`);
        }
      }
    } catch (error: any) {
      console.error('Error completing survey flow:', error);
      toast.error(error.message || 'Failed to save cafe with survey data');
    }
  };

  const handleCancelSurvey = () => {
    setPendingCafeData(null);
    setShowSurvey(false);
    setSurveyCompleted(false);
    toast.info('Cafe submission canceled');
  };

  return (
    <>
      <AddCafeForm 
        onPreSubmit={handleCafePreSubmit}
        surveyCompleted={surveyCompleted}
      />
      
      <Dialog 
        open={showSurvey} 
        onOpenChange={(open) => {
          if (!open) {
            handleCancelSurvey();
          }
        }}
      >
        <DialogContent className="max-w-md mx-auto">
          <DialogTitle className="text-center text-lg font-semibold mb-2">
            Brand Sales Survey
          </DialogTitle>
          <CafeBrandSurvey 
            onComplete={handleSurveyComplete} 
            cafeId={newCafeId} 
            onCancel={handleCancelSurvey}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CafeSurveyWrapper;
