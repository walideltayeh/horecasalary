
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, CheckCircle, PieChart, BarChart2, DollarSign } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Progress } from "@/components/ui/progress";

const Dashboard: React.FC = () => {
  const { 
    getVisitCounts, 
    getContractCounts, 
    calculateSalary,
    kpiSettings
  } = useData();
  
  const visitCounts = getVisitCounts();
  const contractCounts = getContractCounts();
  const salaryStats = calculateSalary();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Monitor your performance and salary metrics</p>
      </div>

      {/* Salary Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Basic Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salaryStats.basicSalary.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {kpiSettings.basicSalaryPercentage}% of total package
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KPI Salary</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salaryStats.totalSalary.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Including ${salaryStats.bonusAmount.toFixed(2)} in bonuses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visit KPI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Building className="mr-2 h-5 w-5" /> Visit KPI Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-medium">
                  {salaryStats.visitStatus.percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={salaryStats.visitStatus.percentage} className="h-2" />
              <div className="mt-1 text-xs text-gray-500">
                Threshold: {kpiSettings.visitThresholdPercentage}% 
                (<span className="kpi-threshold-value">{salaryStats.visitStatus.thresholdValue}</span> visits)
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Visit Summary</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-600">Large</div>
                  <div className="font-bold">
                    {visitCounts.large}/{kpiSettings.targetVisitsLarge}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Medium</div>
                  <div className="font-bold">
                    {visitCounts.medium}/{kpiSettings.targetVisitsMedium}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Small</div>
                  <div className="font-bold">
                    {visitCounts.small}/{kpiSettings.targetVisitsSmall}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Visits</span>
                  <span className="font-bold">
                    {visitCounts.total}/
                    {kpiSettings.targetVisitsLarge + kpiSettings.targetVisitsMedium + kpiSettings.targetVisitsSmall}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Visit KPI Payout</div>
                <div className="text-lg font-bold">${salaryStats.visitKpi.toFixed(2)}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-white text-sm ${salaryStats.visitStatus.thresholdMet ? 'bg-green-500' : 'bg-red-500'}`}>
                {salaryStats.visitStatus.thresholdMet ? 'Threshold Met' : 'Below Threshold'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract KPI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" /> Contract KPI Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-medium">
                  {salaryStats.contractStatus.percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={salaryStats.contractStatus.percentage} className="h-2" />
              <div className="mt-1 text-xs text-gray-500">
                Threshold: {kpiSettings.contractThresholdPercentage}% 
                (<span className="kpi-threshold-value">{salaryStats.contractStatus.thresholdValue}</span> contracts)
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Contract Summary</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-600">Large</div>
                  <div className="font-bold">
                    {contractCounts.large}/{kpiSettings.targetContractsLarge}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Medium</div>
                  <div className="font-bold">
                    {contractCounts.medium}/{kpiSettings.targetContractsMedium}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Small</div>
                  <div className="font-bold">
                    {contractCounts.small}/{kpiSettings.targetContractsSmall}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Contracts</span>
                  <span className="font-bold">
                    {contractCounts.total}/
                    {kpiSettings.targetContractsLarge + kpiSettings.targetContractsMedium + kpiSettings.targetContractsSmall}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Contract KPI Payout</div>
                <div className="text-lg font-bold">${salaryStats.contractKpi.toFixed(2)}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-white text-sm ${salaryStats.contractStatus.thresholdMet ? 'bg-green-500' : 'bg-red-500'}`}>
                {salaryStats.contractStatus.thresholdMet ? 'Threshold Met' : 'Below Threshold'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bonus Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Bonus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-gray-600">Large Cafes</div>
              <div className="text-2xl font-bold">{contractCounts.large}</div>
              <div className="text-sm text-gray-500">
                ${kpiSettings.bonusLargeCafe} per cafe
              </div>
              <div className="text-sm font-medium mt-2">
                ${contractCounts.large * kpiSettings.bonusLargeCafe} total
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-gray-600">Medium Cafes</div>
              <div className="text-2xl font-bold">{contractCounts.medium}</div>
              <div className="text-sm text-gray-500">
                ${kpiSettings.bonusMediumCafe} per cafe
              </div>
              <div className="text-sm font-medium mt-2">
                ${contractCounts.medium * kpiSettings.bonusMediumCafe} total
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-gray-600">Small Cafes</div>
              <div className="text-2xl font-bold">{contractCounts.small}</div>
              <div className="text-sm text-gray-500">
                ${kpiSettings.bonusSmallCafe} per cafe
              </div>
              <div className="text-sm font-medium mt-2">
                ${contractCounts.small * kpiSettings.bonusSmallCafe} total
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border-l-4 border-custom-red">
              <div className="text-gray-600">Total Bonus</div>
              <div className="text-2xl font-bold">${salaryStats.bonusAmount.toFixed(2)}</div>
              <div className="text-sm text-gray-500">
                {contractCounts.total} contracted cafes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
