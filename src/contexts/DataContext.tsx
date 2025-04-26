
import React from 'react';
import { CafeProvider, useCafes } from './CafeContext';
import { KPIProvider, useKPI } from './KPIContext';
import { SalaryProvider, useSalary } from './SalaryContext';

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

  return {
    // Spread all properties from the individual contexts
    ...cafeContext,
    ...kpiContext,
    ...salaryContext
  };
};

// Re-export the individual hooks for convenience
export { useCafes } from './CafeContext';
export { useKPI } from './KPIContext';
export { useSalary } from './SalaryContext';
