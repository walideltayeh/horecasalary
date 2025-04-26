
import React from 'react';
import { CafeProvider } from './CafeContext';
import { KPIProvider } from './KPIContext';
import { SalaryProvider } from './SalaryContext';

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

// Re-export the hooks for convenience
export { useCafes } from './CafeContext';
export { useKPI } from './KPIContext';
export { useSalary } from './SalaryContext';

