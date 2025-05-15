
import { createContext } from 'react';
import { Cafe } from '@/types';
import { CafeProvider } from './cafe/CafeProvider';
import { useCafeContext } from './cafe/useCafeContext';

// Define the context interface
export interface ICafeContext {
  cafes: Cafe[];
  addCafe: (cafeData: any) => Promise<string | null>;
  updateCafe: (cafeId: string, cafeData: any) => Promise<boolean>;
  updateCafeStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => Promise<boolean>;
  getCafeSize: (numberOfHookahs: number) => 'In Negotiation' | 'Small' | 'Medium' | 'Large';
  deleteCafe: (cafeId: string) => Promise<boolean>;
  loading: boolean;
  refreshCafes: (force?: boolean) => Promise<void>;
}

// Create context with default values
export const CafeContext = createContext<ICafeContext>({
  cafes: [],
  addCafe: async () => null,
  updateCafe: async () => false,
  updateCafeStatus: async () => false,
  getCafeSize: () => 'In Negotiation',
  deleteCafe: async () => false,
  loading: false,
  refreshCafes: async () => {},
});

// Export the provider and hook
export { CafeProvider, useCafeContext as useCafes };
