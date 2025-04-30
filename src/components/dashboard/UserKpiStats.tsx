
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
    visitKpi: number;
    contractKpi: number;
  };
  visitCounts: {
    large: number;
    medium: number;
    small: number;
    inNegotiation?: number; // Added the in-negotiation count
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
    totalPackage: number;
    basicSalaryPercentage: number;
    visitKpiPercentage: number;
  };
}

const UserKpiStats: React.FC<UserKpiStatsProps> = ({
  salaryStats,
  visitCounts,
  contractCounts,
  kpiSettings
}) => {
  // Calculate the entitled amounts from KPI settings
  const totalKpiSalary = kpiSettings.totalPackage * ((100 - kpiSettings.basicSalaryPercentage) / 100);
  const entitledVisitKpi = totalKpiSalary * (kpiSettings.visitKpiPercentage / 100);
  const entitledContractKpi = totalKpiSalary - entitledVisitKpi;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Visit KPI */}
      <KpiProgressCard
        title={`Visit KPI Status (${entitledVisitKpi.toFixed(2)})`}
        icon={<Building className="mr-2 h-4 w-4" />}
        percentage={salaryStats.visitStatus.percentage}
        thresholdPercentage={kpiSettings.visitThresholdPercentage}
        thresholdValue={salaryStats.visitStatus.thresholdValue}
        counts={{
          large: visitCounts.large,
          medium: visitCounts.medium,
          small: visitCounts.small,
          inNegotiation: visitCounts.inNegotiation || 0,
          total: visitCounts.total
        }}
        targets={{
          large: kpiSettings.targetVisitsLarge,
          medium: kpiSettings.targetVisitsMedium,
          small: kpiSettings.targetVisitsSmall,
          total: kpiSettings.targetVisitsLarge + kpiSettings.targetVisitsMedium + kpiSettings.targetVisitsSmall
        }}
        showNegotiation={true}
      />

      {/* Contract KPI */}
      <KpiProgressCard
        title={`Contract KPI Status (${entitledContractKpi.toFixed(2)})`}
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
