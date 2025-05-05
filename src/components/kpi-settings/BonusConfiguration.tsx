
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KPISettings } from '@/types';

interface BonusConfigurationProps {
  settings: KPISettings;
  handleChange: (field: keyof KPISettings, value: string) => void;
}

const BonusConfiguration: React.FC<BonusConfigurationProps> = ({ settings, handleChange }) => {
  return (
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
  );
};

export default BonusConfiguration;
