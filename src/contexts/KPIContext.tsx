
import React, { createContext, useContext } from 'react';
import { KPIContextType, DEFAULT_KPI_SETTINGS } from '@/types/kpi';
import { useKPIData } from '@/hooks/kpi/useKPIData';
import { useKPISubscription } from '@/hooks/kpi/useKPISubscription';
import { useKPIUpdater } from '@/hooks/kpi/useKPIUpdater';

// Create the KPI context
const KPIContext = createContext<KPIContextType | undefined>(undefined);

export const KPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { kpiSettings, setKpiSettings, isSyncing, setIsSyncing } = useKPIData();
  
  // Set up realtime subscription
  useKPISubscription(setKpiSettings);

  // Set up KPI updater
  const { updateKPISettings } = useKPIUpdater(kpiSettings, setKpiSettings, setIsSyncing);

  return (
    <KPIContext.Provider value={{ kpiSettings, updateKPISettings }}>
      {children}
    </KPIContext.Provider>
  );
};

// Export hook for using the KPI context
export const useKPI = () => {
  const context = useContext(KPIContext);
  if (context === undefined) {
    throw new Error('useKPI must be used within a KPIProvider');
  }
  return context;
};
