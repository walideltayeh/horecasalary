
import React, { useState } from 'react';
import { useKPI } from '@/contexts/KPIContext';
import PasswordProtection from '@/components/PasswordProtection';
import { Loader2 } from 'lucide-react';
import SalaryBreakdown from '@/components/kpi-settings/SalaryBreakdown';
import VisitTargets from '@/components/kpi-settings/VisitTargets';
import ContractTargets from '@/components/kpi-settings/ContractTargets';
import BonusConfiguration from '@/components/kpi-settings/BonusConfiguration';
import useKPISettings from '@/hooks/kpi/useKPISettings';

const KPISettings: React.FC = () => {
  const { kpiSettings, updateKPISettings } = useKPI();
  const [authenticated, setAuthenticated] = useState(false);
  
  const { 
    settings, 
    syncing, 
    handleChange, 
    derivedValues 
  } = useKPISettings(kpiSettings, updateKPISettings);
  
  // If not authenticated, show password protection
  if (!authenticated) {
    return <PasswordProtection onAuthenticate={() => setAuthenticated(true)} title="KPI Settings" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">KPI Settings</h1>
          <p className="text-gray-600">Configure salary breakdown and performance targets</p>
        </div>
        {syncing && (
          <div className="flex items-center text-amber-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Syncing with server...</span>
          </div>
        )}
      </div>

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
