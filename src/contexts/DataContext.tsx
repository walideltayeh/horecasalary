
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Cafe, KPISettings, CafeSize } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface DataContextType {
  cafes: Cafe[];
  kpiSettings: KPISettings;
  addCafe: (cafe: Omit<Cafe, 'id' | 'createdAt'>) => void;
  updateKPISettings: (settings: Partial<KPISettings>) => void;
  updateCafeStatus: (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => void;
  getCafeSize: (numberOfHookahs: number) => CafeSize;
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
  getVisitCounts: () => {
    small: number;
    medium: number;
    large: number;
    total: number;
  };
  getContractCounts: () => {
    small: number;
    medium: number;
    large: number;
    total: number;
  };
  getUserVisitCounts: (userId: string) => {
    small: number;
    medium: number;
    large: number;
    total: number;
  };
  getUserContractCounts: (userId: string) => {
    small: number;
    medium: number;
    large: number;
    total: number;
  };
}

// Default KPI settings
const DEFAULT_KPI_SETTINGS: KPISettings = {
  totalPackage: 2000,
  basicSalaryPercentage: 20,
  visitKpiPercentage: 80,
  visitThresholdPercentage: 70,
  targetVisitsLarge: 30,
  targetVisitsMedium: 50,
  targetVisitsSmall: 70,
  contractThresholdPercentage: 60,
  targetContractsLarge: 10,
  targetContractsMedium: 15,
  targetContractsSmall: 20,
  bonusLargeCafe: 100,
  bonusMediumCafe: 75,
  bonusSmallCafe: 50,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [kpiSettings, setKpiSettings] = useState<KPISettings>(DEFAULT_KPI_SETTINGS);

  // Load data from localStorage on initial load
  useEffect(() => {
    const storedCafes = localStorage.getItem('horeca-cafes');
    if (storedCafes) {
      setCafes(JSON.parse(storedCafes));
    }

    const storedKPISettings = localStorage.getItem('horeca-kpi-settings');
    if (storedKPISettings) {
      setKpiSettings(JSON.parse(storedKPISettings));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('horeca-cafes', JSON.stringify(cafes));
  }, [cafes]);

  useEffect(() => {
    localStorage.setItem('horeca-kpi-settings', JSON.stringify(kpiSettings));
  }, [kpiSettings]);

  const addCafe = (cafeData: Omit<Cafe, 'id' | 'createdAt'>) => {
    if (!user) return;

    const newCafe: Cafe = {
      ...cafeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setCafes(prev => [...prev, newCafe]);
    toast.success(`Cafe "${cafeData.name}" added successfully`);
  };

  const updateCafeStatus = (cafeId: string, status: 'Pending' | 'Visited' | 'Contracted') => {
    setCafes(prev => 
      prev.map(cafe => {
        // If changing to Contracted status, we automatically consider it visited too
        if (cafe.id === cafeId) {
          return { ...cafe, status };
        }
        return cafe;
      })
    );
  };

  const updateKPISettings = (newSettings: Partial<KPISettings>) => {
    setKpiSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Ensure KPI percentages add up to 100%
      if ('basicSalaryPercentage' in newSettings) {
        updated.basicSalaryPercentage = Math.max(0, Math.min(100, updated.basicSalaryPercentage));
      }

      if ('visitKpiPercentage' in newSettings) {
        updated.visitKpiPercentage = Math.max(0, Math.min(100, updated.visitKpiPercentage));
      }

      return updated;
    });
    toast.success("KPI settings updated successfully");
  };

  const getCafeSize = (numberOfHookahs: number): CafeSize => {
    if (numberOfHookahs === 0) return 'In Negotiation';
    if (numberOfHookahs >= 1 && numberOfHookahs <= 3) return 'Small';
    if (numberOfHookahs >= 4 && numberOfHookahs <= 7) return 'Medium';
    return 'Large';
  };

  const getVisitCounts = () => {
    // Consider both Visited and Contracted cafes as visited
    const visitedCafes = cafes.filter(cafe => cafe.status === 'Visited' || cafe.status === 'Contracted');
    
    const small = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length;
    const medium = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
    const large = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length;
    
    return { small, medium, large, total: small + medium + large };
  };

  const getContractCounts = () => {
    const contractedCafes = cafes.filter(cafe => cafe.status === 'Contracted');
    
    const small = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length;
    const medium = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
    const large = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length;
    
    return { small, medium, large, total: small + medium + large };
  };

  const getUserVisitCounts = (userId: string) => {
    // Consider both Visited and Contracted cafes as visited
    const visitedCafes = cafes.filter(cafe => 
      (cafe.status === 'Visited' || cafe.status === 'Contracted') && cafe.createdBy === userId
    );
    
    const small = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length;
    const medium = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
    const large = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length;
    
    return { small, medium, large, total: small + medium + large };
  };

  const getUserContractCounts = (userId: string) => {
    const contractedCafes = cafes.filter(cafe => 
      cafe.status === 'Contracted' && cafe.createdBy === userId
    );
    
    const small = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length;
    const medium = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
    const large = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length;
    
    return { small, medium, large, total: small + medium + large };
  };

  const calculateSalary = () => {
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

    // Basic values
    const basicSalary = totalPackage * (basicSalaryPercentage / 100);
    const totalKpiSalary = totalPackage - basicSalary;
    
    // Visit vs Contract split
    const visitKpiSalary = totalKpiSalary * (visitKpiPercentage / 100);
    const contractKpiSalary = totalKpiSalary - visitKpiSalary;

    // Calculate targets and achievements
    const visitCounts = getVisitCounts();
    const contractCounts = getContractCounts();
    
    const totalVisitTarget = targetVisitsLarge + targetVisitsMedium + targetVisitsSmall;
    const totalContractTarget = targetContractsLarge + targetContractsMedium + targetContractsSmall;
    
    const visitAchieved = visitCounts.total;
    const contractAchieved = contractCounts.total;
    
    const visitPercentage = totalVisitTarget > 0 ? (visitAchieved / totalVisitTarget) * 100 : 0;
    const contractPercentage = totalContractTarget > 0 ? (contractAchieved / totalContractTarget) * 100 : 0;
    
    // Threshold checks
    const visitThresholdMet = visitPercentage >= visitThresholdPercentage;
    const contractThresholdMet = contractPercentage >= contractThresholdPercentage;
    
    // Calculate payouts
    const visitKpiPayout = visitThresholdMet ? visitKpiSalary : 0;
    const contractKpiPayout = contractThresholdMet ? contractKpiSalary : 0;
    
    // Calculate bonus
    const bonusAmount = 
      (contractCounts.large * bonusLargeCafe) + 
      (contractCounts.medium * bonusMediumCafe) + 
      (contractCounts.small * bonusSmallCafe);
    
    // Total salary
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

  const calculateUserSalary = (userId: string) => {
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

    // Basic values
    const basicSalary = totalPackage * (basicSalaryPercentage / 100);
    const totalKpiSalary = totalPackage - basicSalary;
    
    // Visit vs Contract split
    const visitKpiSalary = totalKpiSalary * (visitKpiPercentage / 100);
    const contractKpiSalary = totalKpiSalary - visitKpiSalary;

    // Calculate targets and achievements
    const visitCounts = getUserVisitCounts(userId);
    const contractCounts = getUserContractCounts(userId);
    
    const totalVisitTarget = targetVisitsLarge + targetVisitsMedium + targetVisitsSmall;
    const totalContractTarget = targetContractsLarge + targetContractsMedium + targetContractsSmall;
    
    const visitAchieved = visitCounts.total;
    const contractAchieved = contractCounts.total;
    
    const visitPercentage = totalVisitTarget > 0 ? (visitAchieved / totalVisitTarget) * 100 : 0;
    const contractPercentage = totalContractTarget > 0 ? (contractAchieved / totalContractTarget) * 100 : 0;
    
    // Threshold checks
    const visitThresholdMet = visitPercentage >= visitThresholdPercentage;
    const contractThresholdMet = contractPercentage >= contractThresholdPercentage;
    
    // Calculate payouts
    const visitKpiPayout = visitThresholdMet ? visitKpiSalary : 0;
    const contractKpiPayout = contractThresholdMet ? contractKpiSalary : 0;
    
    // Calculate bonus
    const bonusAmount = 
      (contractCounts.large * bonusLargeCafe) + 
      (contractCounts.medium * bonusMediumCafe) + 
      (contractCounts.small * bonusSmallCafe);
    
    // Total salary
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

  return (
    <DataContext.Provider
      value={{
        cafes,
        kpiSettings,
        addCafe,
        updateKPISettings,
        updateCafeStatus,
        getCafeSize,
        calculateSalary,
        calculateUserSalary,
        getVisitCounts,
        getContractCounts,
        getUserVisitCounts,
        getUserContractCounts
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
