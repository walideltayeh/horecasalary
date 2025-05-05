
import { useState, useEffect, useRef } from 'react';
import { KPISettings } from '@/types';

export const useKPISettings = (
  kpiSettings: KPISettings,
  updateKPISettings: (settings: Partial<KPISettings>, timeout?: number) => Promise<boolean>
) => {
  const [settings, setSettings] = useState({ ...kpiSettings });
  const [syncing, setSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Use refs for tracking save operations
  const saveInProgressRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveRetryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  // Update local state when kpiSettings change from external sources
  useEffect(() => {
    // Only update if we're not in the middle of saving to prevent loops
    if (!saveInProgressRef.current) {
      setSettings({ ...kpiSettings });
      // Clear unsaved changes flag if settings were updated externally
      setHasUnsavedChanges(false);
    }
  }, [kpiSettings]);

  // Cancel debounced saves when component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
    setSaveError(null);
    
    // If autoSave is enabled, update global state with debouncing
    if (autoSave) {
      // Cancel any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Only set syncing if we're not already syncing
      if (!saveInProgressRef.current) {
        setSyncing(true);
      }
      
      // Set a shorter debounce timer for better UX
      const debounceDelay = 800;
      
      debounceTimerRef.current = setTimeout(async () => {
        if (saveInProgressRef.current) return;
        
        saveInProgressRef.current = true;
        
        try {
          const success = await updateKPISettings(updatedSettings);
          if (success) {
            setHasUnsavedChanges(false);
            saveRetryCountRef.current = 0;
          } else if (saveRetryCountRef.current < MAX_RETRIES) {
            // Retry once if failed
            saveRetryCountRef.current++;
            debounceTimerRef.current = setTimeout(() => {
              saveInProgressRef.current = false;
              handleChange(field, value); // Retry the save
            }, 2000);
          } else {
            setSaveError("Failed to save after multiple attempts");
            saveRetryCountRef.current = 0;
          }
        } finally {
          // Only clear syncing and save in progress if we didn't start a retry
          if (!debounceTimerRef.current) {
            saveInProgressRef.current = false;
            setSyncing(false);
          }
        }
      }, debounceDelay);
    }
  };

  // Manual save function with timeout and retries
  const saveSettings = async (): Promise<boolean> => {
    if (!hasUnsavedChanges || saveInProgressRef.current) return false;
    
    setSyncing(true);
    saveInProgressRef.current = true;
    setSaveError(null);
    
    try {
      // Use a more aggressive timeout for manual saves
      const success = await updateKPISettings(settings, 8000);
      if (success) {
        setHasUnsavedChanges(false);
      } else {
        setSaveError("Save operation failed");
      }
      return success;
    } finally {
      saveInProgressRef.current = false;
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
    saveError,
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
