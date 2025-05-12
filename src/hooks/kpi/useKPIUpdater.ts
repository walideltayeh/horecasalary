
import { KPISettings } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useKPIUpdater = (
  kpiSettings: KPISettings,
  setKpiSettings: React.Dispatch<React.SetStateAction<KPISettings>>,
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const updateKPISettings = async (newSettings: Partial<KPISettings>, timeout?: number): Promise<boolean> => {
    const updatedSettings = { ...kpiSettings, ...newSettings };
    
    if ('basicSalaryPercentage' in newSettings) {
      updatedSettings.basicSalaryPercentage = Math.max(0, Math.min(100, updatedSettings.basicSalaryPercentage));
    }

    if ('visitKpiPercentage' in newSettings) {
      updatedSettings.visitKpiPercentage = Math.max(0, Math.min(100, updatedSettings.visitKpiPercentage));
    }
    
    // Recalculate contract targets whenever visit targets or percentages change
    if ('targetVisitsLarge' in newSettings || 'contractTargetPercentageLarge' in newSettings) {
      updatedSettings.targetContractsLarge = Math.ceil(updatedSettings.targetVisitsLarge * (updatedSettings.contractTargetPercentageLarge / 100));
    }
    
    if ('targetVisitsMedium' in newSettings || 'contractTargetPercentageMedium' in newSettings) {
      updatedSettings.targetContractsMedium = Math.ceil(updatedSettings.targetVisitsMedium * (updatedSettings.contractTargetPercentageMedium / 100));
    }
    
    if ('targetVisitsSmall' in newSettings || 'contractTargetPercentageSmall' in newSettings) {
      updatedSettings.targetContractsSmall = Math.ceil(updatedSettings.targetVisitsSmall * (updatedSettings.contractTargetPercentageSmall / 100));
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
        contract_target_percentage_large: updatedSettings.contractTargetPercentageLarge,
        contract_target_percentage_medium: updatedSettings.contractTargetPercentageMedium,
        contract_target_percentage_small: updatedSettings.contractTargetPercentageSmall,
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
      
      // If a timeout is provided, add a delay before resolving
      if (timeout && timeout > 0) {
        await new Promise(resolve => setTimeout(resolve, timeout));
      }
      
      return true;
    } catch (err: any) {
      console.error('Error syncing KPI settings:', err);
      toast.error(`Failed to save settings: ${err.message}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return { updateKPISettings };
};
