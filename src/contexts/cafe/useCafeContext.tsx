
import { createContext, useContext } from 'react';
import { CafeContext, ICafeContext } from '../CafeContext';

export const useCafeContext = (): React.Context<ICafeContext> => {
  const context = useContext(CafeContext);
  
  if (context === undefined) {
    throw new Error('useCafes must be used within a CafeProvider');
  }
  
  return CafeContext;
};
