
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserBonusSummaryProps {
  contractCounts: {
    large: number;
    medium: number;
    small: number;
    total: number;
  };
  kpiSettings: {
    bonusLargeCafe: number;
    bonusMediumCafe: number;
    bonusSmallCafe: number;
    targetContractsLarge: number;
    targetContractsMedium: number;
    targetContractsSmall: number;
  };
  bonusAmount: number;
}

const UserBonusSummary: React.FC<UserBonusSummaryProps> = ({ 
  contractCounts, 
  kpiSettings, 
  bonusAmount 
}) => {
  console.log("UserBonusSummary rendering with contracts:", contractCounts);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Bonus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-gray-600">Large Cafes</div>
            <div className="text-2xl font-bold">{contractCounts.large}/{kpiSettings.targetContractsLarge}</div>
            <div className="text-sm text-gray-500">
              ${kpiSettings.bonusLargeCafe} per cafe
            </div>
            <div className="text-sm font-medium mt-2">
              ${contractCounts.large * kpiSettings.bonusLargeCafe} total
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-gray-600">Medium Cafes</div>
            <div className="text-2xl font-bold">{contractCounts.medium}/{kpiSettings.targetContractsMedium}</div>
            <div className="text-sm text-gray-500">
              ${kpiSettings.bonusMediumCafe} per cafe
            </div>
            <div className="text-sm font-medium mt-2">
              ${contractCounts.medium * kpiSettings.bonusMediumCafe} total
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-gray-600">Small Cafes</div>
            <div className="text-2xl font-bold">{contractCounts.small}/{kpiSettings.targetContractsSmall}</div>
            <div className="text-sm text-gray-500">
              ${kpiSettings.bonusSmallCafe} per cafe
            </div>
            <div className="text-sm font-medium mt-2">
              ${contractCounts.small * kpiSettings.bonusSmallCafe} total
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border-l-4 border-custom-red">
            <div className="text-gray-600">Total Bonus</div>
            <div className="text-2xl font-bold">${bonusAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-500">
              {contractCounts.total} contracted cafes
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserBonusSummary;
