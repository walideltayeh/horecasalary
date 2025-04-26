
import React, { useState } from 'react';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import AddCafeForm from './AddCafeForm';
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CafeSurveyWrapper: React.FC = () => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [newCafeId, setNewCafeId] = useState<string | null>(null);
  const [pendingCafeData, setPendingCafeData] = useState<any>(null);

  const handleCafeAdded = (cafeId: string, cafeData: any) => {
    console.log("Survey dialog should show - cafeId:", cafeId);
    setNewCafeId(cafeId);
    setPendingCafeData(cafeData);
    setShowSurvey(true);
  };

  const handleSurveyComplete = async () => {
    setShowSurvey(false);
    
    try {
      if (!pendingCafeData) {
        toast.error("No cafe data to save");
        return;
      }
      
      console.log("Saving cafe after survey completion:", pendingCafeData);
      
      const { data: newCafe, error } = await supabase
        .from('cafes')
        .insert([pendingCafeData])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Cafe "${pendingCafeData.name}" added successfully`);
      
      // Reset form after successful save
      setNewCafeId(null);
      setPendingCafeData(null);
      
    } catch (error: any) {
      console.error('Error adding cafe:', error);
      toast.error(error.message || 'Failed to add cafe');
    }
  };

  return (
    <>
      <AddCafeForm onCafeAdded={handleCafeAdded} />
      
      <Dialog 
        open={showSurvey} 
        onOpenChange={(open) => {
          if (!open) setShowSurvey(false);
          console.log("Dialog open state changed to:", open);
        }}
      >
        <DialogContent className="max-w-md mx-auto">
          <DialogTitle className="text-center text-lg font-semibold mb-2">
            Brand Sales Survey
          </DialogTitle>
          <CafeBrandSurvey 
            onComplete={handleSurveyComplete} 
            cafeId={newCafeId || undefined} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CafeSurveyWrapper;
