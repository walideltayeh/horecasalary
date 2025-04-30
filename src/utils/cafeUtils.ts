
import { Cafe, CafeSize } from '@/types';

export const getCafeSize = (numberOfHookahs: number): CafeSize => {
  if (numberOfHookahs === 0) return 'In Negotiation';
  if (numberOfHookahs >= 1 && numberOfHookahs <= 3) return 'Small';
  if (numberOfHookahs >= 4 && numberOfHookahs <= 7) return 'Medium';
  return 'Large';
};

export const getVisitCounts = (cafes: Cafe[]) => {
  // Only count 'Visited' OR 'Contracted' cafes as visited
  const visitedCafes = cafes.filter(cafe => cafe.status === 'Visited' || cafe.status === 'Contracted');
  
  const small = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length;
  const medium = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
  const large = visitedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length;
  
  return { small, medium, large, total: small + medium + large };
};

export const getContractCounts = (cafes: Cafe[]) => {
  // Only count 'Contracted' cafes
  const contractedCafes = cafes.filter(cafe => cafe.status === 'Contracted');
  
  const small = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Small').length;
  const medium = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Medium').length;
  const large = contractedCafes.filter(cafe => getCafeSize(cafe.numberOfHookahs) === 'Large').length;
  
  return { small, medium, large, total: small + medium + large };
};
