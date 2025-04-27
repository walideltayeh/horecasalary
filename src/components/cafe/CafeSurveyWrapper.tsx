import React, { useState, useCallback } from 'react';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import AddCafeForm from './AddCafeForm';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useCafes } from '@/contexts/CafeContext';
import { supabase } from '@/integrations/supabase/client';
import { CafeFormState } from './types/CafeFormTypes';

const CafeSurveyWrapper: React.FC = () => {
  const { addCafe } = useCafes();
  const [showSurvey, setShowSurvey] = useState(false);
  const [newCafeId, setNewCafeId] = useState<string | null>(null);
  const [pendingCafeData, setPendingCafeData] = useState<any>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [formKey, setFormKey] = useState(0); // Add this to force form reset

  // Content for the Cafe tab
  const handleCafePreSubmit = useCallback(async (cafeData: any) => {
    if (cafeData.numberOfHookahs >= 1) {
      console.log("Survey needed, showing dialog for cafe:", cafeData);
      setPendingCafeData(cafeData);
      setShowSurvey(true);
      setSurveyCompleted(false);
      return false;
    }
    
    // If no survey needed, proceed with direct cafe addition
    const savedCafeId = await addCafe(cafeData);
    if (savedCafeId) {
      // Reset form by updating the key
      setFormKey(prevKey => prevKey + 1);
      toast.success(`Cafe "${cafeData.name}" added successfully`);
    }
    return true;
  }, [addCafe]);

  const handleSurveyComplete = async (brandSales: any[]) => {
    try {
      if (pendingCafeData && brandSales.length > 0) {
        console.log("Submitting cafe with survey data:", pendingCafeData, brandSales);
        
        const savedCafeId = await addCafe(pendingCafeData);
        
        if (savedCafeId) {
          const { data: surveyData, error: surveyError } = await supabase
            .from('cafe_surveys')
            .insert({ cafe_id: savedCafeId })
            .select('id')
            .single();

          if (surveyError) throw surveyError;

          if (surveyData) {
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

          // Reset form by updating the key
          setFormKey(prevKey => prevKey + 1);
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
    setFormKey(prevKey => prevKey + 1); // Reset form on cancel
    toast.info('Cafe submission canceled');
  };

  return (
    <>
      <AddCafeForm 
        key={formKey}
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
