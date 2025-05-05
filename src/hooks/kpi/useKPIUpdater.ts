
import { KPISettings } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useKPIUpdater = (
  kpiSettings: KPISettings,
  setKpiSettings: React.Dispatch<React.SetStateAction<KPISettings>>,
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const updateKPISettings = async (newSettings: Partial<KPISettings>, timeout = 10000): Promise<boolean> => {
    const updatedSettings = { ...kpiSettings, ...newSettings };
    
    if ('basicSalaryPercentage' in newSettings) {
      updatedSettings.basicSalaryPercentage = Math.max(0, Math.min(100, updatedSettings.basicSalaryPercentage));
    }

    if ('visitKpiPercentage' in newSettings) {
      updatedSettings.visitKpiPercentage = Math.max(0, Math.min(100, updatedSettings.visitKpiPercentage));
    }
    
    // Update local state immediately for a responsive UI experience
    setKpiSettings(updatedSettings);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Save operation timed out')), timeout);
    });

    try {
      // Create the save promise
      const savePromise = (async () => {
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
        
        setIsSyncing(true);
        
        const { data: existingSettings } = await supabase
          .from('kpi_settings')
          .select('id')
          .limit(1);
          
        if (existingSettings && existingSettings.length > 0) {
          const { error } = await supabase
            .from('kpi_settings')
            .update(mappedSettings)
            .eq('id', existingSettings[0].id);
            
          if (error) throw error;
          return true;
        } else {
          const { error } = await supabase
            .from('kpi_settings')
            .insert([mappedSettings]);
            
          if (error) throw error;
          toast.success("KPI settings created");
          return true;
        }
      })();

      // Race between the save and timeout
      return await Promise.race([savePromise, timeoutPromise]);
    } catch (err: any) {
      console.error('Error syncing KPI settings:', err);
      toast.error(`Failed to save settings: ${err.message}`);
      return false;
    } finally {
      // Always reset syncing state
      setIsSyncing(false);
    }
  };

  return { updateKPISettings };
};
