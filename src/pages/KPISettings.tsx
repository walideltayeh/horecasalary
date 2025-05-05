
import React, { useState, useEffect } from 'react';
import { useKPI } from '@/contexts/KPIContext';
import PasswordProtection from '@/components/PasswordProtection';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import SalaryBreakdown from '@/components/kpi-settings/SalaryBreakdown';
import VisitTargets from '@/components/kpi-settings/VisitTargets';
import ContractTargets from '@/components/kpi-settings/ContractTargets';
import BonusConfiguration from '@/components/kpi-settings/BonusConfiguration';
import useKPISettings from '@/hooks/kpi/useKPISettings';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const KPISettings: React.FC = () => {
  const { kpiSettings, updateKPISettings } = useKPI();
  const [authenticated, setAuthenticated] = useState(false);
  const [saveAttempts, setSaveAttempts] = useState(0);
  
  const { 
    settings, 
    syncing, 
    hasUnsavedChanges,
    saveError,
    handleChange, 
    saveSettings,
    derivedValues 
  } = useKPISettings(kpiSettings, updateKPISettings);
  
  // Reset save attempts counter when syncing state changes
  useEffect(() => {
    if (!syncing && saveAttempts > 0) {
      setSaveAttempts(0);
    }
  }, [syncing]);
  
  // If not authenticated, show password protection
  if (!authenticated) {
    return <PasswordProtection onAuthenticate={() => setAuthenticated(true)} title="KPI Settings" />;
  }

  // Handle manual save with error recovery
  const handleSave = async () => {
    if (syncing) return; // Prevent multiple save attempts while syncing
    
    setSaveAttempts(prev => prev + 1);
    
    try {
      const success = await saveSettings();
      
      if (success) {
        toast({
          title: "Settings Saved",
          description: "KPI settings have been saved and will be reflected for all users.",
          duration: 3000,
        });
      } else if (saveAttempts >= 2) {
        // After 3 attempts, offer a refresh suggestion
        toast({
          title: "Still Having Trouble Saving",
          description: "Please try refreshing the page and making your changes again.",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Save Error",
          description: "There was a problem saving your settings. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error Saving Settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">KPI Settings</h1>
          <p className="text-gray-600">Configure salary breakdown and performance targets</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && !syncing && (
            <span className="text-amber-600 text-sm">Unsaved changes</span>
          )}
          {syncing ? (
            <div className="flex items-center text-amber-600">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Syncing changes...</span>
            </div>
          ) : (
            <Button 
              onClick={handleSave} 
              disabled={!hasUnsavedChanges || syncing}
              className="flex items-center"
              variant={saveError ? "destructive" : "default"}
            >
              {saveError ? <AlertCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              {saveError ? "Retry Save" : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {saveError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {saveError} - Please try the save button again or refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Salary Breakdown */}
      <SalaryBreakdown 
        settings={settings}
        handleChange={handleChange}
        basicSalaryAmount={derivedValues.basicSalaryAmount}
        kpiSalaryPercentage={derivedValues.kpiSalaryPercentage}
        kpiSalaryAmount={derivedValues.kpiSalaryAmount}
        visitKpiAmount={derivedValues.visitKpiAmount}
        contractKpiPercentage={derivedValues.contractKpiPercentage}
        contractKpiAmount={derivedValues.contractKpiAmount}
      />

      {/* Visit Targets */}
      <VisitTargets 
        settings={settings}
        handleChange={handleChange}
      />

      {/* Contract Targets */}
      <ContractTargets 
        settings={settings}
        handleChange={handleChange}
      />

      {/* Bonus Configuration */}
      <BonusConfiguration 
        settings={settings}
        handleChange={handleChange}
      />
    </div>
  );
};

export default KPISettings;
