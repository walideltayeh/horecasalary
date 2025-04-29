
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building, CheckCircle } from 'lucide-react';
import KpiProgressCard from './KpiProgressCard';

interface UserKpiStatsProps {
  salaryStats: {
    visitStatus: {
      percentage: number;
      thresholdValue: number;
    };
    contractStatus: {
      percentage: number;
      thresholdValue: number;
    };
  };
  visitCounts: {
    large: number;
    medium: number;
    small: number;
    total: number;
  };
  contractCounts: {
    large: number;
    medium: number;
    small: number;
    total: number;
  };
  kpiSettings: {
    visitThresholdPercentage: number;
    contractThresholdPercentage: number;
    targetVisitsLarge: number;
    targetVisitsMedium: number;
    targetVisitsSmall: number;
    targetContractsLarge: number;
    targetContractsMedium: number;
    targetContractsSmall: number;
  };
}

const UserKpiStats: React.FC<UserKpiStatsProps> = ({
  salaryStats,
  visitCounts,
  contractCounts,
  kpiSettings
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Visit KPI */}
      <KpiProgressCard
        title="Visit KPI Status"
        icon={<Building className="mr-2 h-4 w-4" />}
        percentage={salaryStats.visitStatus.percentage}
        thresholdPercentage={kpiSettings.visitThresholdPercentage}
        thresholdValue={salaryStats.visitStatus.thresholdValue}
        counts={{
          large: visitCounts.large,
          medium: visitCounts.medium,
          small: visitCounts.small,
          total: visitCounts.total
        }}
        targets={{
          large: kpiSettings.targetVisitsLarge,
          medium: kpiSettings.targetVisitsMedium,
          small: kpiSettings.targetVisitsSmall,
          total: kpiSettings.targetVisitsLarge + kpiSettings.targetVisitsMedium + kpiSettings.targetVisitsSmall
        }}
      />

      {/* Contract KPI */}
      <KpiProgressCard
        title="Contract KPI Status"
        icon={<CheckCircle className="mr-2 h-4 w-4" />}
        percentage={salaryStats.contractStatus.percentage}
        thresholdPercentage={kpiSettings.contractThresholdPercentage}
        thresholdValue={salaryStats.contractStatus.thresholdValue}
        counts={{
          large: contractCounts.large,
          medium: contractCounts.medium,
          small: contractCounts.small,
          total: contractCounts.total
        }}
        targets={{
          large: kpiSettings.targetContractsLarge,
          medium: kpiSettings.targetContractsMedium,
          small: kpiSettings.targetContractsSmall,
          total: kpiSettings.targetContractsLarge + kpiSettings.targetContractsMedium + kpiSettings.targetContractsSmall
        }}
      />
    </div>
  );
};

export default UserKpiStats;
