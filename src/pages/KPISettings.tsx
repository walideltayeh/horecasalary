
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from '@/contexts/DataContext';
import PasswordProtection from '@/components/PasswordProtection';
import { Loader2 } from 'lucide-react';

const KPISettings: React.FC = () => {
  const { kpiSettings, updateKPISettings } = useData();
  const [settings, setSettings] = useState({ ...kpiSettings });
  const [authenticated, setAuthenticated] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Update local state when kpiSettings change
  useEffect(() => {
    setSettings({ ...kpiSettings });
  }, [kpiSettings]);

  const handleChange = (field: keyof typeof settings, value: string) => {
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

  // If not authenticated, show password protection
  if (!authenticated) {
    return <PasswordProtection onAuthenticate={() => setAuthenticated(true)} title="KPI Settings" />;
  }

  // Calculate derived values
  const kpiSalaryPercentage = 100 - settings.basicSalaryPercentage;
  const contractKpiPercentage = 100 - settings.visitKpiPercentage;
  
  const basicSalaryAmount = settings.totalPackage * (settings.basicSalaryPercentage / 100);
  const kpiSalaryAmount = settings.totalPackage - basicSalaryAmount;
  
  const visitKpiAmount = kpiSalaryAmount * (settings.visitKpiPercentage / 100);
  const contractKpiAmount = kpiSalaryAmount - visitKpiAmount;

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
      <Card>
        <CardHeader>
          <CardTitle>Salary Breakdown</CardTitle>
          <CardDescription>Configure the total package and salary components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalPackage">Total Package ($)</Label>
              <Input
                id="totalPackage"
                type="number"
                value={settings.totalPackage}
                onChange={(e) => handleChange('totalPackage', e.target.value)}
                className="input-with-red-outline"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basicSalaryPercentage">Basic Salary (%)</Label>
                <Input
                  id="basicSalaryPercentage"
                  type="number"
                  value={settings.basicSalaryPercentage}
                  onChange={(e) => handleChange('basicSalaryPercentage', e.target.value)}
                  className="input-with-red-outline"
                />
                <div className="text-sm text-gray-600 mt-1">
                  = ${basicSalaryAmount.toFixed(2)}
                </div>
              </div>

              <div>
                <Label>KPI Salary (%)</Label>
                <Input
                  type="number"
                  value={kpiSalaryPercentage}
                  disabled
                  className="bg-gray-100"
                />
                <div className="text-sm text-gray-600 mt-1">
                  = ${kpiSalaryAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-4">KPI Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visitKpiPercentage">Visit KPI (%)</Label>
                <Input
                  id="visitKpiPercentage"
                  type="number"
                  value={settings.visitKpiPercentage}
                  onChange={(e) => handleChange('visitKpiPercentage', e.target.value)}
                  className="input-with-red-outline"
                />
                <div className="text-sm text-gray-600 mt-1">
                  = ${visitKpiAmount.toFixed(2)}
                </div>
              </div>

              <div>
                <Label>Contract KPI (%)</Label>
                <Input
                  type="number"
                  value={contractKpiPercentage}
                  disabled
                  className="bg-gray-100"
                />
                <div className="text-sm text-gray-600 mt-1">
                  = ${contractKpiAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Targets</CardTitle>
          <CardDescription>Set targets for cafe visits and threshold</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="visitThresholdPercentage">Visit Threshold (%)</Label>
            <Input
              id="visitThresholdPercentage"
              type="number"
              value={settings.visitThresholdPercentage}
              onChange={(e) => handleChange('visitThresholdPercentage', e.target.value)}
              className="input-with-red-outline"
            />
            <div className="text-sm text-gray-600 mt-1">
              If visits are below this percentage, the visit KPI will be zero
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="targetVisitsLarge">Target Large Cafe Visits</Label>
              <Input
                id="targetVisitsLarge"
                type="number"
                value={settings.targetVisitsLarge}
                onChange={(e) => handleChange('targetVisitsLarge', e.target.value)}
                className="input-with-red-outline"
              />
            </div>
            <div>
              <Label htmlFor="targetVisitsMedium">Target Medium Cafe Visits</Label>
              <Input
                id="targetVisitsMedium"
                type="number"
                value={settings.targetVisitsMedium}
                onChange={(e) => handleChange('targetVisitsMedium', e.target.value)}
                className="input-with-red-outline"
              />
            </div>
            <div>
              <Label htmlFor="targetVisitsSmall">Target Small Cafe Visits</Label>
              <Input
                id="targetVisitsSmall"
                type="number"
                value={settings.targetVisitsSmall}
                onChange={(e) => handleChange('targetVisitsSmall', e.target.value)}
                className="input-with-red-outline"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Targets</CardTitle>
          <CardDescription>Set custom percentages for contract targets relative to visit targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="contractThresholdPercentage">Contract Threshold (%)</Label>
            <Input
              id="contractThresholdPercentage"
              type="number"
              value={settings.contractThresholdPercentage}
              onChange={(e) => handleChange('contractThresholdPercentage', e.target.value)}
              className="input-with-red-outline"
            />
            <div className="text-sm text-gray-600 mt-1">
              If contracts are below this percentage, the contract KPI will be zero
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Large Cafe Contract Settings */}
            <div className="space-y-4 border p-4 rounded-md">
              <h4 className="font-semibold">Large Cafe</h4>
              
              <div>
                <Label htmlFor="contractTargetPercentageLarge">Target Percentage (%)</Label>
                <Input
                  id="contractTargetPercentageLarge"
                  type="number"
                  value={settings.contractTargetPercentageLarge}
                  onChange={(e) => handleChange('contractTargetPercentageLarge', e.target.value)}
                  className="input-with-red-outline"
                />
                <div className="text-xs text-gray-500">
                  % of visit targets
                </div>
              </div>
              
              <div>
                <Label>Resulting Contracts Target</Label>
                <Input
                  type="number"
                  value={settings.targetContractsLarge}
                  disabled
                  className="bg-gray-100"
                />
                <div className="text-xs text-gray-500 mt-1">
                  = {settings.targetVisitsLarge} × {settings.contractTargetPercentageLarge}%
                </div>
              </div>
            </div>
            
            {/* Medium Cafe Contract Settings */}
            <div className="space-y-4 border p-4 rounded-md">
              <h4 className="font-semibold">Medium Cafe</h4>
              
              <div>
                <Label htmlFor="contractTargetPercentageMedium">Target Percentage (%)</Label>
                <Input
                  id="contractTargetPercentageMedium"
                  type="number"
                  value={settings.contractTargetPercentageMedium}
                  onChange={(e) => handleChange('contractTargetPercentageMedium', e.target.value)}
                  className="input-with-red-outline"
                />
                <div className="text-xs text-gray-500">
                  % of visit targets
                </div>
              </div>
              
              <div>
                <Label>Resulting Contracts Target</Label>
                <Input
                  type="number"
                  value={settings.targetContractsMedium}
                  disabled
                  className="bg-gray-100"
                />
                <div className="text-xs text-gray-500 mt-1">
                  = {settings.targetVisitsMedium} × {settings.contractTargetPercentageMedium}%
                </div>
              </div>
            </div>
            
            {/* Small Cafe Contract Settings */}
            <div className="space-y-4 border p-4 rounded-md">
              <h4 className="font-semibold">Small Cafe</h4>
              
              <div>
                <Label htmlFor="contractTargetPercentageSmall">Target Percentage (%)</Label>
                <Input
                  id="contractTargetPercentageSmall"
                  type="number"
                  value={settings.contractTargetPercentageSmall}
                  onChange={(e) => handleChange('contractTargetPercentageSmall', e.target.value)}
                  className="input-with-red-outline"
                />
                <div className="text-xs text-gray-500">
                  % of visit targets
                </div>
              </div>
              
              <div>
                <Label>Resulting Contracts Target</Label>
                <Input
                  type="number"
                  value={settings.targetContractsSmall}
                  disabled
                  className="bg-gray-100"
                />
                <div className="text-xs text-gray-500 mt-1">
                  = {settings.targetVisitsSmall} × {settings.contractTargetPercentageSmall}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Bonus</CardTitle>
          <CardDescription>Set bonus amounts for different cafe sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bonusLargeCafe">Large Cafe Bonus ($)</Label>
              <Input
                id="bonusLargeCafe"
                type="number"
                value={settings.bonusLargeCafe}
                onChange={(e) => handleChange('bonusLargeCafe', e.target.value)}
                className="input-with-red-outline"
              />
            </div>
            <div>
              <Label htmlFor="bonusMediumCafe">Medium Cafe Bonus ($)</Label>
              <Input
                id="bonusMediumCafe"
                type="number"
                value={settings.bonusMediumCafe}
                onChange={(e) => handleChange('bonusMediumCafe', e.target.value)}
                className="input-with-red-outline"
              />
            </div>
            <div>
              <Label htmlFor="bonusSmallCafe">Small Cafe Bonus ($)</Label>
              <Input
                id="bonusSmallCafe"
                type="number"
                value={settings.bonusSmallCafe}
                onChange={(e) => handleChange('bonusSmallCafe', e.target.value)}
                className="input-with-red-outline"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPISettings;
