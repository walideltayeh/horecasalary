
export interface User {
  id: string;
  email: string; // Ensure email is required
  role: 'admin' | 'user';
  name: string;
  password?: string;
}

export interface Cafe {
  id: string;
  name: string;
  ownerName: string;
  ownerNumber: string;
  numberOfHookahs: number;
  numberOfTables: number;
  status: 'Pending' | 'Visited' | 'Contracted';
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  governorate: string;
  city: string;
  createdAt: string;
  createdBy: string;
}

export type CafeSize = 'Small' | 'Medium' | 'Large' | 'In Negotiation';

export interface KPISettings {
  totalPackage: number;
  basicSalaryPercentage: number;
  visitKpiPercentage: number;
  visitThresholdPercentage: number;
  targetVisitsLarge: number;
  targetVisitsMedium: number;
  targetVisitsSmall: number;
  contractThresholdPercentage: number;
  targetContractsLarge: number;
  targetContractsMedium: number;
  targetContractsSmall: number;
  bonusLargeCafe: number;
  bonusMediumCafe: number;
  bonusSmallCafe: number;
}

export interface MexicoLocation {
  governorate: string;
  cities: string[];
}
