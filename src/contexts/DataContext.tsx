import React, { createContext, useState, useContext, useEffect } from 'react';
import { Cafe, KPISettings, CafeSize } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  deleteCafe: (cafeId: string) => void;
}

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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetchKpiSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('kpi_settings')
          .select('*')
          .limit(1)
          .single();
          
        if (error) {
          console.error('Error fetching KPI settings:', error);
          const storedKPISettings = localStorage.getItem('horeca-kpi-settings');
          if (storedKPISettings) {
            setKpiSettings(JSON.parse(storedKPISettings));
          }
        } else if (data) {
          const mappedSettings: KPISettings = {
            totalPackage: data.total_package,
            basicSalaryPercentage: data.basic_salary_percentage,
            visitKpiPercentage: data.visit_kpi_percentage,
            visitThresholdPercentage: data.visit_threshold_percentage,
            targetVisitsLarge: data.target_visits_large,
            targetVisitsMedium: data.target_visits_medium,
            targetVisitsSmall: data.target_visits_small,
            contractThresholdPercentage: data.contract_threshold_percentage,
            targetContractsLarge: data.target_contracts_large,
            targetContractsMedium: data.target_contracts_medium,
            targetContractsSmall: data.target_contracts_small,
            bonusLargeCafe: data.bonus_large_cafe,
            bonusMediumCafe: data.bonus_medium_cafe,
            bonusSmallCafe: data.bonus_small_cafe,
          };
          
          setKpiSettings(mappedSettings);
          localStorage.setItem('horeca-kpi-settings', JSON.stringify(mappedSettings));
        }
      } catch (err) {
        console.error('Error in KPI settings fetch:', err);
      }
      
      setIsInitialized(true);
    };
    
    fetchKpiSettings();
  }, [user]);

  useEffect(() => {
    const storedCafes = localStorage.getItem('horeca-cafes');
    if (storedCafes) {
      setCafes(JSON.parse(storedCafes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('horeca-cafes', JSON.stringify(cafes));
  }, [cafes]);

  const updateKPISettings = async (newSettings: Partial<KPISettings>) => {
    if (!user) return;
    
    const updatedSettings = { ...kpiSettings, ...newSettings };
    
    if ('basicSalaryPercentage' in newSettings) {
      updatedSettings.basicSalaryPercentage = Math.max(0, Math.min(100, updatedSettings.basicSalaryPercentage));
    }

    if ('visitKpiPercentage' in newSettings) {
      updatedSettings.visitKpiPercentage = Math.max(0, Math.min(100, updatedSettings.visitKpiPercentage));
    }
    
    setKpiSettings(updatedSettings);
    localStorage.setItem('horeca-kpi-settings', JSON.stringify(updatedSettings));
    
    try {
      const mappedSettings = {
        total_package: updatedSettings.totalPackage,
        basic_salary_percentage: updatedSettings.basicSalaryPercentage,
        visit_kpi_percentage: updatedSettings.visitKpiPercentage,
        visit_threshold_percentage: updatedSettings.visitThresholdPercentage,
        target_visits_large: updatedSettings.targetVisitsLarge,
        target_visits_medium: updatedSettings.targetVisitsMedium,
        target_visits_small: updatedSettings.targetVisitsSmall,
        contract_threshold_percentage: updatedSettings.contractThresholdPercentage,
        target_contracts_large: updatedSettings.targetContractsLarge,
        target_contracts_medium: updatedSettings.targetContractsMedium,
        target_contracts_small: updatedSettings.targetContractsSmall,
        bonus_large_cafe: updatedSettings.bonusLargeCafe,
        bonus_medium_cafe: updatedSettings.bonusMediumCafe,
        bonus_small_cafe: updatedSettings.bonusSmallCafe,
        updated_at: new Date().toISOString()
      };
      
      const { data: existingSettings } = await supabase
        .from('kpi_settings')
        .select('id')
        .limit(1);
        
      if (existingSettings && existingSettings.length > 0) {
        const { error } = await supabase
          .from('kpi_settings')
          .update(mappedSettings)
          .eq('id', existingSettings[0].id);
          
        if (error) {
          console.error('Error updating KPI settings in Supabase:', error);
          toast.success("KPI settings updated locally");
        } else {
          toast.success("KPI settings updated and synced to server");
        }
      } else {
        const { error } = await supabase
          .from('kpi_settings')
          .insert([mappedSettings]);
          
        if (error) {
          console.error('Error inserting KPI settings in Supabase:', error);
          toast.success("KPI settings updated locally");
        } else {
          toast.success("KPI settings created and synced to server");
        }
      }
    } catch (err) {
      console.error('Error syncing KPI settings:', err);
      toast.success("KPI settings updated locally");
    }
  };

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
        if (cafe.id === cafeId) {
          return { ...cafe, status };
        }
        return cafe;
      })
    );
  };

  const getCafeSize = (numberOfHookahs: number): CafeSize => {
    if (numberOfHookahs === 0) return 'In Negotiation';
    if (numberOfHookahs >= 1 && numberOfHookahs <= 3) return 'Small';
    if (numberOfHookahs >= 4 && numberOfHookahs <= 7) return 'Medium';
    return 'Large';
  };

  const getVisitCounts = () => {
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

    const basicSalary = totalPackage * (basicSalaryPercentage / 100);
    const totalKpiSalary = totalPackage - basicSalary;
    
    const visitKpiSalary = totalKpiSalary * (visitKpiPercentage / 100);
    const contractKpiSalary = totalKpiSalary - visitKpiSalary;

    const visitCounts = getVisitCounts();
    const contractCounts = getContractCounts();
    
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

    const basicSalary = totalPackage * (basicSalaryPercentage / 100);
    const totalKpiSalary = totalPackage - basicSalary;
    
    const visitKpiSalary = totalKpiSalary * (visitKpiPercentage / 100);
    const contractKpiSalary = totalKpiSalary - visitKpiSalary;

    const visitCounts = getUserVisitCounts(userId);
    const contractCounts = getUserContractCounts(userId);
    
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

  const deleteCafe = (cafeId: string) => {
    setCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
    toast.success("Cafe deleted successfully");
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
        getUserContractCounts,
        deleteCafe
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
