
import React, { createContext, useContext, useState } from 'react';
import { KPISettings } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_KPI_SETTINGS: KPISettings = {
  totalPackage: 2000,
  basicSalaryPercentage: 20,
  visitKpiPercentage: 80,
  visitThresholdPercentage: 70,
  targetVisitsLarge: 30,
  targetVisitsMedium: 50,
  targetVisitsSmall: 70,
  contractThresholdPercentage: 60,
  targetContractsLarge: 10,
  targetContractsMedium: 15,
  targetContractsSmall: 20,
  bonusLargeCafe: 100,
  bonusMediumCafe: 75,
  bonusSmallCafe: 50,
};

interface KPIContextType {
  kpiSettings: KPISettings;
  updateKPISettings: (settings: Partial<KPISettings>) => Promise<void>;
}

const KPIContext = createContext<KPIContextType | undefined>(undefined);

export const KPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kpiSettings, setKpiSettings] = useState<KPISettings>(DEFAULT_KPI_SETTINGS);
  const [isSyncing, setIsSyncing] = useState(false);

  const updateKPISettings = async (newSettings: Partial<KPISettings>): Promise<void> => {
    const updatedSettings = { ...kpiSettings, ...newSettings };
    
    if ('basicSalaryPercentage' in newSettings) {
      updatedSettings.basicSalaryPercentage = Math.max(0, Math.min(100, updatedSettings.basicSalaryPercentage));
    }

    if ('visitKpiPercentage' in newSettings) {
      updatedSettings.visitKpiPercentage = Math.max(0, Math.min(100, updatedSettings.visitKpiPercentage));
    }
    
    setKpiSettings(updatedSettings);
    
    try {
      setIsSyncing(true);
      
      const mappedSettings = {
        total_package: updatedSettings.totalPackage,
        basic_salary_percentage: updatedSettings.basicSalaryPercentage,
        visit_kpi_percentage: updatedSettings.visitKpiPercentage,
        visit_threshold_percentage: updatedSettings.visitThresholdPercentage,
        target_visits_large: updatedSettings.targetVisitsLarge,
        target_visits_medium: updatedSettings.targetVisitsMedium,
        target_visits_small: updatedSettings.targetVisitsSmall,
        contract_threshold_percentage: updatedSettings.contractThresholdPercentage,
        target_contracts_large: updatedSettings.targetContractsLarge,
        target_contracts_medium: updatedSettings.targetContractsMedium,
        target_contracts_small: updatedSettings.targetContractsSmall,
        bonus_large_cafe: updatedSettings.bonusLargeCafe,
        bonus_medium_cafe: updatedSettings.bonusMediumCafe,
        bonus_small_cafe: updatedSettings.bonusSmallCafe,
        updated_at: new Date().toISOString()
      };
      
      const { data: existingSettings, error: queryError } = await supabase
        .from('kpi_settings')
        .select('id')
        .limit(1);
        
      if (queryError) throw queryError;
        
      if (existingSettings && existingSettings.length > 0) {
        const { error } = await supabase
          .from('kpi_settings')
          .update(mappedSettings)
          .eq('id', existingSettings[0].id);
          
        if (error) throw error;
        toast.success("KPI settings updated and synced to server");
      } else {
        const { error } = await supabase
          .from('kpi_settings')
          .insert([mappedSettings]);
          
        if (error) throw error;
        toast.success("KPI settings created and synced to server");
      }
    } catch (err: any) {
      console.error('Error syncing KPI settings:', err);
      toast.error(`Sync failed: ${err.message}. Using local settings.`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <KPIContext.Provider value={{ kpiSettings, updateKPISettings }}>
      {children}
    </KPIContext.Provider>
  );
};

export const useKPI = () => {
  const context = useContext(KPIContext);
  if (context === undefined) {
    throw new Error('useKPI must be used within a KPIProvider');
  }
  return context;
};

