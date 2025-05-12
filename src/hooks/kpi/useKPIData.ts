
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPISettings } from '@/types';
import { DEFAULT_KPI_SETTINGS } from '@/types/kpi';
import { toast } from 'sonner';

export const useKPIData = () => {
  const [kpiSettings, setKpiSettings] = useState<KPISettings>(DEFAULT_KPI_SETTINGS);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch KPI settings on initial load
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
            contractTargetPercentageLarge: data.contract_target_percentage_large || 70,
            contractTargetPercentageMedium: data.contract_target_percentage_medium || 70,
            contractTargetPercentageSmall: data.contract_target_percentage_small || 70,
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

  return { 
    kpiSettings, 
    setKpiSettings, 
    isSyncing, 
    setIsSyncing 
  };
};
