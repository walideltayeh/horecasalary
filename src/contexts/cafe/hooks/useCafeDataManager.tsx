
import { useState, useRef } from 'react';
import { Cafe } from '@/types';

/**
 * Hook for managing cafe data state
 * Separates concerns from the main useCafeState hook
 */
export const useCafeDataManager = () => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const pendingDeletions = useRef<Set<string>>(new Set());
  
  return {
    cafes,
    setCafes,
    pendingDeletions
  };
};
