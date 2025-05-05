
import { KPISettings } from './index';

export interface KPIContextType {
  kpiSettings: KPISettings;
  updateKPISettings: (settings: Partial<KPISettings>, timeout?: number) => Promise<boolean>;
}

export const DEFAULT_KPI_SETTINGS: KPISettings = {
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
