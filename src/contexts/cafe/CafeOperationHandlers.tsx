
import { Cafe } from '@/types';
import { toast } from 'sonner';

interface CafeOperationHandlersProps {
  fetchCafes: (force?: boolean) => Promise<void>;
  addCafe: (cafe: Omit<Cafe, 'id' | 'createdAt'>) => Promise<string | null>;
  updateCafeStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => Promise<boolean>;
  updateCafe: (cafeId: string, cafeData: Partial<Cafe>) => Promise<boolean>;
  deleteCafe: (cafeId: string) => Promise<boolean>;
  pendingDeletions: React.MutableRefObject<Set<string>>;
  setCafes: React.Dispatch<React.SetStateAction<Cafe[]>>;
}

export const useCafeOperationHandlers = ({
  fetchCafes,
  addCafe,
  updateCafeStatus,
  updateCafe,
  deleteCafe,
  pendingDeletions,
  setCafes
}: CafeOperationHandlersProps) => {
  
  const handleAddCafe = async (cafe: Omit<Cafe, 'id' | 'createdAt'>) => {
    console.log("Adding cafe:", cafe);
    const cafeId = await addCafe(cafe);
    if (cafeId) {
      await fetchCafes(true);
      window.dispatchEvent(new CustomEvent('horeca_data_updated'));
      toast.success("Cafe added successfully");
    }
    return cafeId;
  };

  const handleUpdateCafeStatus = async (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => {
    const result = await updateCafeStatus(cafeId, status);
    if (result) {
      window.dispatchEvent(new CustomEvent('horeca_data_updated'));
    }
    return result;
  };
  
  const handleUpdateCafe = async (cafeId: string, cafeData: Partial<Cafe>) => {
    const result = await updateCafe(cafeId, cafeData);
    if (result) {
      window.dispatchEvent(new CustomEvent('horeca_data_updated'));
    }
    return result;
  };
  
  const handleDeleteCafe = async (cafeId: string) => {
    try {
      if (pendingDeletions.current.has(cafeId)) {
        console.log(`Deletion already in progress for cafe ${cafeId}`);
        toast.info("Deletion already in progress");
        return false;
      }
      
      pendingDeletions.current.add(cafeId);
      
      setCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
      
      const result = await deleteCafe(cafeId);
      
      if (result) {
        console.log(`Cafe ${cafeId} successfully deleted`);
        window.dispatchEvent(new CustomEvent('horeca_data_updated'));
      } else {
        console.log(`Deletion failed for cafe ${cafeId}, restoring in local state`);
        fetchCafes(true);
      }
      
      pendingDeletions.current.delete(cafeId);
      return result;
    } catch (error) {
      console.error(`Error in handleDeleteCafe for ${cafeId}:`, error);
      pendingDeletions.current.delete(cafeId);
      return false;
    }
  };

  return {
    handleAddCafe,
    handleUpdateCafeStatus,
    handleUpdateCafe,
    handleDeleteCafe
  };
};
