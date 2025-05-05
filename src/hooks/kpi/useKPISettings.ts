
import { useState, useEffect } from 'react';
import { KPISettings } from '@/types';

export const useKPISettings = (
  kpiSettings: KPISettings,
  updateKPISettings: (settings: Partial<KPISettings>) => Promise<void>
) => {
  const [settings, setSettings] = useState({ ...kpiSettings });
  const [syncing, setSyncing] = useState(false);

  // Update local state when kpiSettings change
  useEffect(() => {
    setSettings({ ...kpiSettings });
  }, [kpiSettings]);

  const handleChange = (field: keyof KPISettings, value: string) => {
    setSyncing(true);
    const numValue = Number(value);
    
    // Create a new settings object with the updated field
    const updatedSettings = { ...settings, [field]: numValue };
    
    // Special case for percentage fields that need to be calculated
    if (field === 'basicSalaryPercentage') {
      // Basic salary percentage changed, update KPI percentage to complement
      const kpiPercentage = 100 - numValue;
      updatedSettings.basicSalaryPercentage = numValue;
    }
    
    // Update contract targets based on visit targets and percentages
    if (field === 'targetVisitsLarge' || field === 'contractTargetPercentageLarge') {
      updatedSettings.targetContractsLarge = Math.ceil(
        updatedSettings.targetVisitsLarge * (updatedSettings.contractTargetPercentageLarge / 100)
      );
    }
    if (field === 'targetVisitsMedium' || field === 'contractTargetPercentageMedium') {
      updatedSettings.targetContractsMedium = Math.ceil(
        updatedSettings.targetVisitsMedium * (updatedSettings.contractTargetPercentageMedium / 100)
      );
    }
    if (field === 'targetVisitsSmall' || field === 'contractTargetPercentageSmall') {
      updatedSettings.targetContractsSmall = Math.ceil(
        updatedSettings.targetVisitsSmall * (updatedSettings.contractTargetPercentageSmall / 100)
      );
    }
    
    // Update local state
    setSettings(updatedSettings);
    
    // Update global state
    updateKPISettings(updatedSettings);
    
    // Set syncing to false after a short delay to show the syncing indicator
    setTimeout(() => setSyncing(false), 1000);
  };

  // Calculate derived values
  const kpiSalaryPercentage = 100 - settings.basicSalaryPercentage;
  const contractKpiPercentage = 100 - settings.visitKpiPercentage;
  
  const basicSalaryAmount = settings.totalPackage * (settings.basicSalaryPercentage / 100);
  const kpiSalaryAmount = settings.totalPackage - basicSalaryAmount;
  
  const visitKpiAmount = kpiSalaryAmount * (settings.visitKpiPercentage / 100);
  const contractKpiAmount = kpiSalaryAmount - visitKpiAmount;

  return {
    settings,
    syncing,
    handleChange,
    derivedValues: {
      kpiSalaryPercentage,
      contractKpiPercentage,
      basicSalaryAmount,
      kpiSalaryAmount,
      visitKpiAmount,
      contractKpiAmount
    }
  };
};

export default useKPISettings;
