
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  
  console.log("UserBonusSummary rendering with contracts:", contractCounts);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('bonus.contract')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-gray-600">{t('bonus.large.cafes')}</div>
            <div className="text-2xl font-bold">{contractCounts.large}/{kpiSettings.targetContractsLarge}</div>
            <div className="text-sm text-gray-500">
              ${kpiSettings.bonusLargeCafe} {t('bonus.per.cafe')}
            </div>
            <div className="text-sm font-medium mt-2">
              ${contractCounts.large * kpiSettings.bonusLargeCafe} total
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-gray-600">{t('bonus.medium.cafes')}</div>
            <div className="text-2xl font-bold">{contractCounts.medium}/{kpiSettings.targetContractsMedium}</div>
            <div className="text-sm text-gray-500">
              ${kpiSettings.bonusMediumCafe} {t('bonus.per.cafe')}
            </div>
            <div className="text-sm font-medium mt-2">
              ${contractCounts.medium * kpiSettings.bonusMediumCafe} total
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-gray-600">{t('bonus.small.cafes')}</div>
            <div className="text-2xl font-bold">{contractCounts.small}/{kpiSettings.targetContractsSmall}</div>
            <div className="text-sm text-gray-500">
              ${kpiSettings.bonusSmallCafe} {t('bonus.per.cafe')}
            </div>
            <div className="text-sm font-medium mt-2">
              ${contractCounts.small * kpiSettings.bonusSmallCafe} total
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border-l-4 border-custom-red">
            <div className="text-gray-600">{t('bonus.total')}</div>
            <div className="text-2xl font-bold">${bonusAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-500">
              {contractCounts.total} {t('bonus.contracted.cafes')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserBonusSummary;
