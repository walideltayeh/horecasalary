
import { KPISettings } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useKPIUpdater = (
  kpiSettings: KPISettings,
  setKpiSettings: React.Dispatch<React.SetStateAction<KPISettings>>,
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>
) => {
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

  return { updateKPISettings };
};
