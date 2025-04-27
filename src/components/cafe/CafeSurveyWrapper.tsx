
import React, { useState } from 'react';
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

  // Handle form submission and show survey if hookahs ≥ 1
  const handleCafeSubmit = async (cafeData: any) => {
    try {
      // Check if survey is needed (number of hookahs ≥ 1)
      if (cafeData.numberOfHookahs >= 1) {
        // Store the cafe data temporarily and show survey
        setPendingCafeData(cafeData);
        setShowSurvey(true);
      } else {
        // Save directly if no survey needed (hookahs = 0)
        const savedCafeId = await addCafe(cafeData);
        if (savedCafeId) {
          toast.success(`Cafe "${cafeData.name}" added successfully`);
        }
      }
    } catch (error: any) {
      console.error('Error handling cafe submission:', error);
      toast.error(error.message || 'Failed to process cafe');
    }
  };

  const handleSurveyComplete = async () => {
    try {
      if (pendingCafeData) {
        // Now save the cafe data after survey completion
        const savedCafeId = await addCafe(pendingCafeData);
        if (savedCafeId) {
          setNewCafeId(savedCafeId);
          toast.success(`Cafe "${pendingCafeData.name}" added with survey data`);
        }
        // Clear the pending data
        setPendingCafeData(null);
      }
      // Close survey dialog
      setShowSurvey(false);
    } catch (error: any) {
      console.error('Error completing survey flow:', error);
      toast.error(error.message || 'Failed to save cafe with survey data');
    }
  };

  const handleCancelSurvey = () => {
    setPendingCafeData(null);
    setShowSurvey(false);
    toast.info('Cafe submission canceled');
  };

  return (
    <>
      <AddCafeForm onSubmitCafe={handleCafeSubmit} />
      
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
