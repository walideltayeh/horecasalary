
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

  // Since we're not directly using onCafeAdded anymore, we'll need to subscribe to cafe creation events 
  // This can be handled through the CafeContext

  const handleSurveyComplete = () => {
    setShowSurvey(false);
    setNewCafeId(null);
  };

  return (
    <>
      <AddCafeForm />
      
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
