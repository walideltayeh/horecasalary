
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
  contract_target_percentage_large: number;
  contract_target_percentage_medium: number;
  contract_target_percentage_small: number;
  bonus_large_cafe: number;
  bonus_medium_cafe: number;
  bonus_small_cafe: number;
}

export const useKPISubscription = (setKpiSettings: React.Dispatch<React.SetStateAction<KPISettings>>) => {
  useEffect(() => {
    // Listen for database changes through Supabase Realtime
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
            contractTargetPercentageLarge: newData.contract_target_percentage_large || 70,
            contractTargetPercentageMedium: newData.contract_target_percentage_medium || 70,
            contractTargetPercentageSmall: newData.contract_target_percentage_small || 70,
            bonusLargeCafe: newData.bonus_large_cafe,
            bonusMediumCafe: newData.bonus_medium_cafe,
            bonusSmallCafe: newData.bonus_small_cafe,
          });
        }
      )
      .subscribe();

    // Also listen for custom refresh events
    const handleKPISettingsUpdate = () => {
      console.log("KPI settings update event received, refreshing data");
      supabase
        .from('kpi_settings')
        .select('*')
        .limit(1)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error refreshing KPI settings:", error);
            return;
          }
          
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
            console.log("KPI settings refreshed from database");
          }
        });
    };
    
    window.addEventListener('kpi_settings_updated', handleKPISettingsUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('kpi_settings_updated', handleKPISettingsUpdate);
    };
  }, [setKpiSettings]);
};
