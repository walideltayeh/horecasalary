
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSalaryCardsProps {
  salaryStats: {
    basicSalary: number;
    visitKpi: number;
    contractKpi: number;
    totalSalary: number;
    bonusAmount: number;
  };
  kpiSettings: {
    basicSalaryPercentage: number;
    totalPackage: number;
  };
}

const UserSalaryCards: React.FC<UserSalaryCardsProps> = ({ salaryStats, kpiSettings }) => {
  // Calculate the entitled amounts from KPI settings
  const entitledBasicSalary = kpiSettings.totalPackage * (kpiSettings.basicSalaryPercentage / 100);
  const entitledKpiSalary = kpiSettings.totalPackage - entitledBasicSalary;
  const entitledTotalSalary = kpiSettings.totalPackage;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Basic Salary <span className="font-bold text-red-600">($${entitledBasicSalary.toFixed(2)})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${salaryStats.basicSalary.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {kpiSettings.basicSalaryPercentage}% of total package
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            KPI Salary <span className="font-bold text-red-600">($${entitledKpiSalary.toFixed(2)})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(salaryStats.visitKpi + salaryStats.contractKpi).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {100 - kpiSettings.basicSalaryPercentage}% of total package
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Salary <span className="font-bold text-red-600">($${entitledTotalSalary.toFixed(2)})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${salaryStats.totalSalary.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Including ${salaryStats.bonusAmount.toFixed(2)} in bonuses
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSalaryCards;
