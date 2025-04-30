
import React, { createContext, useContext, useState, useEffect } from 'react';
import { KPISettings } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

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

  useEffect(() => {
    const fetchKPISettings = async () => {
      try {
        const { data, error } = await supabase
          .from('kpi_settings')
          .select('*')
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setKpiSettings({
            totalPackage: data.total_package,
            basicSalaryPercentage: data.basic_salary_percentage,
            visitKpiPercentage: data.visit_kpi_percentage,
            visitThresholdPercentage: data.visit_threshold_percentage,
            targetVisitsLarge: data.target_visits_large,
            targetVisitsMedium: data.target_visits_medium,
            targetVisitsSmall: data.target_visits_small,
            contractThresholdPercentage: data.contract_threshold_percentage,
            targetContractsLarge: data.target_contracts_large,
            targetContractsMedium: data.target_contracts_medium,
            targetContractsSmall: data.target_contracts_small,
            bonusLargeCafe: data.bonus_large_cafe,
            bonusMediumCafe: data.bonus_medium_cafe,
            bonusSmallCafe: data.bonus_small_cafe,
          });
        }
      } catch (err: any) {
        console.error('Error fetching KPI settings:', err);
        toast.error('Failed to load KPI settings');
      }
    };

    fetchKPISettings();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('kpi-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kpi_settings'
        },
        (payload: RealtimePostgresUpdatePayload<{
          total_package: number;
          basic_salary_percentage: number;
          visit_kpi_percentage: number;
          visit_threshold_percentage: number;
          target_visits_large: number;
          target_visits_medium: number;
          target_visits_small: number;
          contract_threshold_percentage: number;
          target_contracts_large: number;
          target_contracts_medium: number;
          target_contracts_small: number;
          bonus_large_cafe: number;
          bonus_medium_cafe: number;
          bonus_small_cafe: number;
        }>) => {
          const newData = payload.new;
          setKpiSettings({
            totalPackage: newData.total_package,
            basicSalaryPercentage: newData.basic_salary_percentage,
            visitKpiPercentage: newData.visit_kpi_percentage,
            visitThresholdPercentage: newData.visit_threshold_percentage,
            targetVisitsLarge: newData.target_visits_large,
            targetVisitsMedium: newData.target_visits_medium,
            targetVisitsSmall: newData.target_visits_small,
            contractThresholdPercentage: newData.contract_threshold_percentage,
            targetContractsLarge: newData.target_contracts_large,
            targetContractsMedium: newData.target_contracts_medium,
            targetContractsSmall: newData.target_contracts_small,
            bonusLargeCafe: newData.bonus_large_cafe,
            bonusMediumCafe: newData.bonus_medium_cafe,
            bonusSmallCafe: newData.bonus_small_cafe,
          });
          // Removed toast notification here
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        toast.success("KPI settings updated");
      } else {
        const { error } = await supabase
          .from('kpi_settings')
          .insert([mappedSettings]);
          
        if (error) throw error;
        toast.success("KPI settings created");
      }
    } catch (err: any) {
      console.error('Error syncing KPI settings:', err);
      toast.error(`Failed to save settings: ${err.message}`);
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
