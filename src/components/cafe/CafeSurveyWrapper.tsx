
import React, { useState } from 'react';
import CafeBrandSurvey from '@/components/CafeBrandSurvey';
import AddCafeForm from './AddCafeForm';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const CafeSurveyWrapper: React.FC = () => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [newCafeId, setNewCafeId] = useState<string | null>(null);

  const handleCafeAdded = (cafeId: string) => {
    setNewCafeId(cafeId);
    setShowSurvey(true);
  };

  const handleSurveyComplete = () => {
    setShowSurvey(false);
    setNewCafeId(null);
  };

  return (
    <>
      <AddCafeForm onCafeAdded={handleCafeAdded} />
      
      <Dialog open={showSurvey} onOpenChange={(open) => !open && setShowSurvey(false)}>
        <DialogContent className="max-w-md mx-auto">
          <CafeBrandSurvey onComplete={handleSurveyComplete} cafeId={newCafeId || undefined} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CafeSurveyWrapper;
