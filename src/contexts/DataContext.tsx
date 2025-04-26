
import React from 'react';
import { CafeProvider, useCafes } from './CafeContext';
import { KPIProvider, useKPI } from './KPIContext';
import { SalaryProvider, useSalary } from './SalaryContext';
import { getVisitCounts, getContractCounts } from '@/utils/cafeUtils';
import { Cafe } from '@/types';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <KPIProvider>
      <CafeProvider>
        <SalaryProvider>
          {children}
        </SalaryProvider>
      </CafeProvider>
    </KPIProvider>
  );
};

// Create a single useData hook that combines all context hooks
export const useData = () => {
  const cafeContext = useCafes();
  const kpiContext = useKPI();
  const salaryContext = useSalary();

  // Add utility functions for cafes filtering by user
  const getUserVisitCounts = (userId: string) => {
    const userCafes = cafeContext.cafes.filter(cafe => cafe.createdBy === userId);
    return getVisitCounts(userCafes);
  };

  const getUserContractCounts = (userId: string) => {
    const userCafes = cafeContext.cafes.filter(cafe => cafe.createdBy === userId);
    return getContractCounts(userCafes);
  };

  return {
    // Spread all properties from the individual contexts
    ...cafeContext,
    ...kpiContext,
    ...salaryContext,
    
    // Include utility functions directly in useData
    getVisitCounts: () => getVisitCounts(cafeContext.cafes),
    getContractCounts: () => getContractCounts(cafeContext.cafes),
    getUserVisitCounts,
    getUserContractCounts
  };
};

// Re-export the individual hooks for convenience
export { useCafes } from './CafeContext';
export { useKPI } from './KPIContext';
export { useSalary } from './SalaryContext';
