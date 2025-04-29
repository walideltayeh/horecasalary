
import { createContext, useContext } from 'react';
import { Cafe, CafeSize } from '@/types';

// Define the context type
export interface CafeContextType {
  cafes: Cafe[];
  addCafe: (cafe: Omit<Cafe, 'id' | 'createdAt'>) => Promise<string | null>;
  updateCafe: (cafeId: string, cafeData: Partial<Cafe>) => Promise<boolean>;
  updateCafeStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => Promise<boolean>;
  getCafeSize: (numberOfHookahs: number) => CafeSize;
  deleteCafe: (cafeId: string) => Promise<boolean>;
  loading: boolean;
  refreshCafes: () => Promise<void>;
}

// Create the context with default undefined value
export const CafeContext = createContext<CafeContextType | undefined>(undefined);

// Custom hook for using the context
export const useCafes = () => {
  const context = useContext(CafeContext);
  if (context === undefined) {
    throw new Error('useCafes must be used within a CafeProvider');
  }
  return context;
};
