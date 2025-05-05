
import { useState, useEffect } from 'react';
import { KPISettings } from '@/types';

export const useKPISettings = (
  kpiSettings: KPISettings,
  updateKPISettings: (settings: Partial<KPISettings>) => Promise<void>
) => {
  const [settings, setSettings] = useState({ ...kpiSettings });
  const [syncing, setSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  // Track if there's a save in progress to prevent multiple save operations
  const [saveInProgress, setSaveInProgress] = useState(false);

  // Update local state when kpiSettings change
  useEffect(() => {
    setSettings({ ...kpiSettings });
  }, [kpiSettings]);

  const handleChange = (field: keyof KPISettings, value: string) => {
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
    setHasUnsavedChanges(true);
    
    // If autoSave is enabled, update global state with debouncing
    if (autoSave && !saveInProgress) {
      const debounceDelay = 1500; // Debounce delay of 1.5 seconds
      
      setSyncing(true);
      setSaveInProgress(true);
      
      const timeoutId = setTimeout(async () => {
        try {
          await updateKPISettings(updatedSettings);
          setHasUnsavedChanges(false);
        } finally {
          setSaveInProgress(false);
          setSyncing(false);
        }
      }, debounceDelay);
      
      // Clear timeout if component unmounts or if settings change again before timeout completes
      return () => {
        clearTimeout(timeoutId);
        setSaveInProgress(false);
      };
    }
  };

  // Manual save function
  const saveSettings = async () => {
    if (!hasUnsavedChanges || saveInProgress) return;
    
    setSyncing(true);
    setSaveInProgress(true);
    
    try {
      await updateKPISettings(settings);
      setHasUnsavedChanges(false);
    } finally {
      setSaveInProgress(false);
      setSyncing(false);
    }
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
    hasUnsavedChanges,
    handleChange,
    saveSettings,
    setAutoSave,
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
