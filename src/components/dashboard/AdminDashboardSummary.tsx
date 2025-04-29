
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from '@/contexts/DataContext';
import { StatsOverview } from '../admin/StatsOverview';

const AdminDashboardSummary: React.FC = () => {
  const { 
    getVisitCounts, 
    getContractCounts, 
    calculateSalary,
    kpiSettings,
  } = useData();

  const visitCounts = getVisitCounts();
  const contractCounts = getContractCounts();
  const salaryStats = calculateSalary();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cafes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Visited Cafes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contracted Cafes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractCounts.total}</div>
          </CardContent>
        </Card>
      </div>
      
      <StatsOverview cafes={[]} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visit Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-gray-600 text-sm">Large</div>
                  <div className="font-bold">
                    {visitCounts.large}/{kpiSettings.targetVisitsLarge}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Medium</div>
                  <div className="font-bold">
                    {visitCounts.medium}/{kpiSettings.targetVisitsMedium}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Small</div>
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contract Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-gray-600 text-sm">Large</div>
                  <div className="font-bold">
                    {contractCounts.large}/{kpiSettings.targetContractsLarge}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Medium</div>
                  <div className="font-bold">
                    {contractCounts.medium}/{kpiSettings.targetContractsMedium}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Small</div>
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
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Bonus Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-gray-600">Large Cafes</div>
              <div className="text-2xl font-bold">{contractCounts.large}</div>
              <div className="text-sm text-gray-500">
                ${kpiSettings.bonusLargeCafe} per cafe
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-gray-600">Medium Cafes</div>
              <div className="text-2xl font-bold">{contractCounts.medium}</div>
              <div className="text-sm text-gray-500">
                ${kpiSettings.bonusMediumCafe} per cafe
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-gray-600">Small Cafes</div>
              <div className="text-2xl font-bold">{contractCounts.small}</div>
              <div className="text-sm text-gray-500">
                ${kpiSettings.bonusSmallCafe} per cafe
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

export default AdminDashboardSummary;
