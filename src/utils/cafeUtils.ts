
import { Cafe, CafeSize } from '@/types';

export const getCafeSize = (numberOfHookahs: number): CafeSize => {
  if (numberOfHookahs === 0) return 'In Negotiation';
  if (numberOfHookahs >= 1 && numberOfHookahs <= 3) return 'Small';
  if (numberOfHookahs >= 4 && numberOfHookahs <= 7) return 'Medium';
  return 'Large';
};

export const getVisitCounts = (cafes: Cafe[]) => {
  // Fix: Ensure we're counting both 'Visited' AND 'Contracted' cafes as visited
  const visitedCafes = cafes.filter(cafe => cafe.status === 'Visited' || cafe.status === 'Contracted');
  
  const small = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length;
  const medium = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
  const large = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length;
  
  // Log for debugging
  console.log("Visit counts:", { small, medium, large, total: small + medium + large });
  
  return { small, medium, large, total: small + medium + large };
};

export const getContractCounts = (cafes: Cafe[]) => {
  // Only count 'Contracted' cafes
  const contractedCafes = cafes.filter(cafe => cafe.status === 'Contracted');
  
  const small = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length;
  const medium = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
  const large = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length;
  
  // Log for debugging
  console.log("Contract counts:", { small, medium, large, total: small + medium + large });
  
  return { small, medium, large, total: small + medium + large };
};

// Add new validation function to check if a cafe can be updated to a specific status
export const canUpdateCafeStatus = (cafe: Cafe, newStatus: 'Pending' | 'Visited' | 'Contracted'): boolean => {
  // If cafe is in negotiation (0 hookahs) it cannot be marked as contracted
  if (cafe.numberOfHookahs === 0 && newStatus === 'Contracted') {
    return false;
  }
  
  return true;
};
