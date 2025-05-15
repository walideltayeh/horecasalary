
import { useContext } from 'react';
import { CafeContext, ICafeContext } from '../CafeContext';

export const useCafeContext = (): ICafeContext => {
  const context = useContext(CafeContext);
  
  if (context === undefined) {
    throw new Error('useCafes must be used within a CafeProvider');
  }
  
  return context;
};
