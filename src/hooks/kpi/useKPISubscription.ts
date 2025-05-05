
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPISettings } from '@/types';
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

interface KPIRealtimePayload {
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
}

export const useKPISubscription = (setKpiSettings: React.Dispatch<React.SetStateAction<KPISettings>>) => {
  useEffect(() => {
    const channel = supabase.channel('kpi-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kpi_settings'
        },
        (payload: RealtimePostgresUpdatePayload<KPIRealtimePayload>) => {
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setKpiSettings]);
};
