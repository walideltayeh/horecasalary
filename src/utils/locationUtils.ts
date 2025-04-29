
import { mexicoLocations } from '@/data/mexicoLocations';

// Extract all governorate names from the mexicoLocations array
export const getGovernorates = (): string[] => {
  return mexicoLocations.map(location => location.governorate);
};

// Get cities for a specific governorate
export const getCitiesForGovernorate = (governorate: string): string[] => {
  const location = mexicoLocations.find(loc => loc.governorate === governorate);
  return location ? location.cities : [];
};
