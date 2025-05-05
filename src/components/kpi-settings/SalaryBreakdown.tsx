
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KPISettings } from '@/types';

interface SalaryBreakdownProps {
  settings: KPISettings;
  handleChange: (field: keyof KPISettings, value: string) => void;
  basicSalaryAmount: number;
  kpiSalaryPercentage: number;
  kpiSalaryAmount: number;
  visitKpiAmount: number;
  contractKpiPercentage: number;
  contractKpiAmount: number;
}

const SalaryBreakdown: React.FC<SalaryBreakdownProps> = ({ 
  settings, 
  handleChange, 
  basicSalaryAmount,
  kpiSalaryPercentage,
  kpiSalaryAmount,
  visitKpiAmount,
  contractKpiPercentage,
  contractKpiAmount
}) => {
  return (
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
  );
};

export default SalaryBreakdown;
