
import { useRef } from 'react';
import { Cafe } from '@/types';
import { useData } from '@/contexts/DataContext';
import { canUpdateCafeStatus } from '@/utils/cafeUtils';
import { toast } from 'sonner';

export const useCafeStatusUpdate = (
  setLocalCafes: React.Dispatch<React.SetStateAction<Cafe[]>>,
  cafes: Cafe[]
) => {
  const { updateCafeStatus } = useData();
  const mounted = useRef(true);
  
  const handleUpdateStatus = async (cafeId: string, newStatus: 'Pending' | 'Visited' | 'Contracted') => {
    // Find the cafe to check validation
    const cafe = cafes.find(c => c.id === cafeId);
    
    if (!cafe) {
      toast.error("Cafe not found");
      return;
    }
    
    // Validate status update
    if (!canUpdateCafeStatus(cafe, newStatus)) {
      toast.error(`Cannot mark a cafe in negotiation (0 hookahs) as Contracted`);
      return;
    }
    
    // Optimistic update
    setLocalCafes(prev => 
      prev.map(cafe => cafe.id === cafeId ? {...cafe, status: newStatus} : cafe)
    );
    
    try {
      const success = await updateCafeStatus(cafeId, newStatus);
      if (!success && mounted.current) {
        // Revert on failure
        setLocalCafes(cafes);
        toast.error(`Failed to update cafe status`);
      } else {
        // Only show critical success notifications
        if (newStatus === 'Contracted') {
          toast.success(`Cafe status updated to Contracted`);
        }
        
        // Broadcast a data update event with specific action for immediate refresh
        window.dispatchEvent(new CustomEvent('horeca_data_updated', {
          detail: { 
            action: 'statusUpdate', 
            cafeId, 
            newStatus,
            timestamp: Date.now(),
            forceRefresh: true
          }
        }));
      }
    } catch (error) {
      if (mounted.current) {
        setLocalCafes(cafes);
        toast.error(`Error updating status`);
      }
    }
  };
  
  return { handleUpdateStatus };
};
