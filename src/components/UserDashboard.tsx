
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useData } from '@/contexts/DataContext';
import { Building, CheckCircle, PieChart } from 'lucide-react';
import CafeList from './CafeList';

interface UserDashboardProps {
  userId: string;
  userName: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userId, userName }) => {
  const { 
    cafes,
    kpiSettings,
    calculateUserSalary,
    getUserVisitCounts,
    getUserContractCounts
  } = useData();
  
  const salaryStats = calculateUserSalary(userId);
  const visitCounts = getUserVisitCounts(userId);
  const contractCounts = getUserContractCounts(userId);
  const userCafes = cafes.filter(cafe => cafe.createdBy === userId);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{userName}'s Dashboard</h2>
      
      {/* Salary Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Basic Salary</CardTitle>
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
            <CardTitle className="text-sm font-medium">KPI Salary</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
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
            <CardTitle className="text-md font-medium flex items-center">
              <Building className="mr-2 h-4 w-4" /> Visit KPI Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="bg-gray-50 p-3 rounded-md">
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
              <div className="mt-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold">
                    {visitCounts.total}/
                    {kpiSettings.targetVisitsLarge + kpiSettings.targetVisitsMedium + kpiSettings.targetVisitsSmall}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract KPI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md font-medium flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" /> Contract KPI Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="bg-gray-50 p-3 rounded-md">
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
              <div className="mt-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold">
                    {contractCounts.total}/
                    {kpiSettings.targetContractsLarge + kpiSettings.targetContractsMedium + kpiSettings.targetContractsSmall}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Cafes List */}
      <Card>
        <CardHeader>
          <CardTitle>Cafes Created by {userName}</CardTitle>
        </CardHeader>
        <CardContent>
          <CafeList filterByUser={userId} adminView={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
