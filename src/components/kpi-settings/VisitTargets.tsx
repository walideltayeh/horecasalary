
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KPISettings } from '@/types';

interface VisitTargetsProps {
  settings: KPISettings;
  handleChange: (field: keyof KPISettings, value: string) => void;
}

const VisitTargets: React.FC<VisitTargetsProps> = ({ settings, handleChange }) => {
  return (
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
  );
};

export default VisitTargets;
