
import { useState } from 'react';
import { Cafe } from '@/types';
import { useCafeAdd } from './cafe/useCafeAdd';
import { useCafeUpdate } from './cafe/useCafeUpdate';
import { useCafeDelete } from './cafe/useCafeDelete';

export const useCafeOperations = () => {
  const [loading, setLoading] = useState(true);
  const { addCafe } = useCafeAdd();
  const { updateCafeStatus, updateCafe } = useCafeUpdate();
  const { deleteCafe } = useCafeDelete();

  return {
    loading,
    setLoading,
    addCafe,
    updateCafe,
    updateCafeStatus,
    deleteCafe
  };
};
