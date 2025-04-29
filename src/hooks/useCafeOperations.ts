
import { useState } from 'react';
import { Cafe } from '@/types';
import { useCafeAdd } from './cafe/useCafeAdd';
import { useCafeUpdate } from './cafe/useCafeUpdate';

// Remove the useCafeDelete import to break the circular dependency
// and pass the deleteCafe function as a parameter instead

export const useCafeOperations = () => {
  const [loading, setLoading] = useState(true);
  const { addCafe } = useCafeAdd();
  const { updateCafeStatus, updateCafe } = useCafeUpdate();

  return {
    loading,
    setLoading,
    addCafe,
    updateCafe,
    updateCafeStatus,
    // deleteCafe is now removed from here and will be provided by the context directly
  };
};
