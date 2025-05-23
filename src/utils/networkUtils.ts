
/**
 * Network utility functions with retry logic
 */

/**
 * Fetches data with retry mechanism using exponential backoff
 * @param operation Function that returns a Promise
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in ms (will be multiplied by 2^retry)
 */
export async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${retry + 1}/${maxRetries + 1} failed:`, error);
      
      if (retry < maxRetries) {
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, retry);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Checks if the device has an internet connection
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Monitors online/offline status and executes callbacks
 * @param onOnline Function to execute when online
 * @param onOffline Function to execute when offline
 */
export function setupConnectivityMonitoring(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('Device is online');
    onOnline?.();
  };
  
  const handleOffline = () => {
    console.log('Device is offline');
    onOffline?.();
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
  
  return () => {};
}
