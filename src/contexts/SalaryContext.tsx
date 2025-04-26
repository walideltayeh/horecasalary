
import React, { createContext, useContext } from 'react';
import { useKPI } from './KPIContext';
import { useCafes } from './CafeContext';
import { getVisitCounts, getContractCounts } from '@/utils/cafeUtils';

interface SalaryContextType {
  calculateSalary: () => {
    basicSalary: number;
    kpiSalary: number;
    visitKpi: number;
    contractKpi: number;
    totalSalary: number;
    visitStatus: {
      achieved: number;
      target: number;
      percentage: number;
      thresholdMet: boolean;
      thresholdValue: number;
    };
    contractStatus: {
      achieved: number;
      target: number;
      percentage: number;
      thresholdMet: boolean;
      thresholdValue: number;
    };
    bonusAmount: number;
  };
  calculateUserSalary: (userId: string) => {
    basicSalary: number;
    kpiSalary: number;
    visitKpi: number;
    contractKpi: number;
    totalSalary: number;
    visitStatus: {
      achieved: number;
      target: number;
      percentage: number;
      thresholdMet: boolean;
      thresholdValue: number;
    };
    contractStatus: {
      achieved: number;
      target: number;
      percentage: number;
      thresholdMet: boolean;
      thresholdValue: number;
    };
    bonusAmount: number;
  };
}

const SalaryContext = createContext<SalaryContextType | undefined>(undefined);

export const SalaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { kpiSettings } = useKPI();
  const { cafes } = useCafes();

  const calculateSalaryStats = (userCafes = cafes) => {
    const { 
      totalPackage, 
      basicSalaryPercentage, 
      visitKpiPercentage, 
      visitThresholdPercentage,
      contractThresholdPercentage,
      targetVisitsLarge,
      targetVisitsMedium,
      targetVisitsSmall,
      targetContractsLarge,
      targetContractsMedium,
      targetContractsSmall,
      bonusLargeCafe,
      bonusMediumCafe,
      bonusSmallCafe
    } = kpiSettings;

    const basicSalary = totalPackage * (basicSalaryPercentage / 100);
    const totalKpiSalary = totalPackage - basicSalary;
    
    const visitKpiSalary = totalKpiSalary * (visitKpiPercentage / 100);
    const contractKpiSalary = totalKpiSalary - visitKpiSalary;

    const visitCounts = getVisitCounts(userCafes);
    const contractCounts = getContractCounts(userCafes);
    
    const totalVisitTarget = targetVisitsLarge + targetVisitsMedium + targetVisitsSmall;
    const totalContractTarget = targetContractsLarge + targetContractsMedium + targetContractsSmall;
    
    const visitAchieved = visitCounts.total;
    const contractAchieved = contractCounts.total;
    
    const visitPercentage = totalVisitTarget > 0 ? (visitAchieved / totalVisitTarget) * 100 : 0;
    const contractPercentage = totalContractTarget > 0 ? (contractAchieved / totalContractTarget) * 100 : 0;
    
    const visitThresholdMet = visitPercentage >= visitThresholdPercentage;
    const contractThresholdMet = contractPercentage >= contractThresholdPercentage;
    
    const visitKpiPayout = visitThresholdMet ? visitKpiSalary : 0;
    const contractKpiPayout = contractThresholdMet ? contractKpiSalary : 0;
    
    const bonusAmount = 
      (contractCounts.large * bonusLargeCafe) + 
      (contractCounts.medium * bonusMediumCafe) + 
      (contractCounts.small * bonusSmallCafe);
    
    const totalSalary = basicSalary + visitKpiPayout + contractKpiPayout + bonusAmount;
    
    const visitThresholdValue = Math.round(totalVisitTarget * (visitThresholdPercentage / 100));
    const contractThresholdValue = Math.round(totalContractTarget * (contractThresholdPercentage / 100));

    return {
      basicSalary,
      kpiSalary: totalKpiSalary,
      visitKpi: visitKpiPayout,
      contractKpi: contractKpiPayout,
      totalSalary,
      visitStatus: {
        achieved: visitAchieved,
        target: totalVisitTarget,
        percentage: visitPercentage,
        thresholdMet: visitThresholdMet,
        thresholdValue: visitThresholdValue
      },
      contractStatus: {
        achieved: contractAchieved,
        target: totalContractTarget,
        percentage: contractPercentage,
        thresholdMet: contractThresholdMet,
        thresholdValue: contractThresholdValue
      },
      bonusAmount
    };
  };

  const calculateSalary = () => calculateSalaryStats();

  const calculateUserSalary = (userId: string) => {
    const userCafes = cafes.filter(cafe => cafe.createdBy === userId);
    return calculateSalaryStats(userCafes);
  };

  return (
    <SalaryContext.Provider value={{ calculateSalary, calculateUserSalary }}>
      {children}
    </SalaryContext.Provider>
  );
};

export const useSalary = () => {
  const context = useContext(SalaryContext);
  if (context === undefined) {
    throw new Error('useSalary must be used within a SalaryProvider');
  }
  return context;
};

