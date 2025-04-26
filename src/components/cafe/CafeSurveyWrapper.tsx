
import React, { useState } from 'react';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import AddCafeForm from './AddCafeForm';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useCafes } from '@/contexts/CafeContext';

const CafeSurveyWrapper: React.FC = () => {
  const { addCafe } = useCafes();
  const [showSurvey, setShowSurvey] = useState(false);
  const [newCafeId, setNewCafeId] = useState<string | null>(null);

  const handleCafeAdded = async (cafeId: string, cafeData: any) => {
    console.log("Cafe added, showing survey dialog - cafeId:", cafeId);
    
    try {
      // Use the context's addCafe method to ensure real-time updates
      const savedCafeId = await addCafe(cafeData);
      
      if (savedCafeId) {
        setNewCafeId(savedCafeId);
        setShowSurvey(true);
      } else {
        toast.error("Failed to add cafe");
      }
    } catch (error: any) {
      console.error('Error adding cafe:', error);
      toast.error(error.message || 'Failed to add cafe');
    }
  };

  const handleSurveyComplete = () => {
    setShowSurvey(false);
    setNewCafeId(null);
  };

  return (
    <>
      <AddCafeForm onCafeAdded={handleCafeAdded} />
      
      <Dialog 
        open={showSurvey} 
        onOpenChange={(open) => {
          setShowSurvey(open);
          if (!open) {
            console.log("Dialog closed by user interaction");
          }
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
