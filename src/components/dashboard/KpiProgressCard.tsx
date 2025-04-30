
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface KpiCounts {
  large: number;
  medium: number;
  small: number;
  inNegotiation?: number; // Added optional inNegotiation count
  total: number;
}

interface KpiProgressCardProps {
  title: string;
  icon: React.ReactNode;
  percentage: number;
  thresholdPercentage: number;
  thresholdValue: number;
  counts: KpiCounts;
  targets: KpiCounts;
  showNegotiation?: boolean; // Flag to determine whether to show the "Under Negotiation" section
}

const KpiProgressCard: React.FC<KpiProgressCardProps> = ({
  title,
  icon,
  percentage,
  thresholdPercentage,
  thresholdValue,
  counts,
  targets,
  showNegotiation = false // Default to false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md font-medium flex items-center">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-medium">
              {percentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="mt-1 text-xs text-gray-500">
            Threshold: {thresholdPercentage}% 
            (<span className="kpi-threshold-value">{thresholdValue}</span>)
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-gray-600">Large</div>
              <div className="font-bold">
                {counts.large}/{targets.large}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Medium</div>
              <div className="font-bold">
                {counts.medium}/{targets.medium}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Small</div>
              <div className="font-bold">
                {counts.small}/{targets.small}
              </div>
            </div>
          </div>
          
          {/* Display "Under Negotiation" section if showNegotiation is true */}
          {showNegotiation && counts.inNegotiation !== undefined && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Under Negotiation</span>
                <span className="font-bold">
                  {counts.inNegotiation || 0}
                </span>
              </div>
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-bold">
                {counts.total}/{targets.total}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiProgressCard;
