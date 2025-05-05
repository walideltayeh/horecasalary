
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KPISettings } from '@/types';

interface ContractTargetsProps {
  settings: KPISettings;
  handleChange: (field: keyof KPISettings, value: string) => void;
}

const ContractTargets: React.FC<ContractTargetsProps> = ({ settings, handleChange }) => {
  return (
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
  );
};

export default ContractTargets;
