
import React, { useState, useEffect } from 'react';
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

  // Set up a subscription to listen for new cafes being added
  useEffect(() => {
    const subscription = supabase
      .channel('cafe-added-channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'cafes' 
        }, 
        (payload) => {
          console.log("New cafe detected via realtime:", payload);
          if (payload.new) {
            setNewCafeId(payload.new.id);
            setShowSurvey(true);
          }
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

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
