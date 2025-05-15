
/**
 * Utility functions for handling network operations with retry logic
 */

/**
 * Configuration options for fetch retry
 */
interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Performs a fetch operation with exponential backoff retry logic
 * @param fetchFn The fetch function to execute
 * @param options Retry configuration options
 * @returns The fetch result
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
    onRetry = (attempt, error) => console.warn(`Retry attempt ${attempt} after error:`, error)
  } = options;

  let attempt = 0;
  
  while (true) {
    try {
      return await fetchFn();
    } catch (error: any) {
      attempt++;
      
      // Check if we should stop retrying
      if (attempt > maxRetries) {
        console.error(`Failed after ${attempt} attempts:`, error);
        throw error;
      }
      
      // For HTTP errors, check if status is retryable
      if (error.status && !retryableStatusCodes.includes(error.status)) {
        console.error(`Non-retryable status code ${error.status}:`, error);
        throw error;
      }
      
      // Calculate delay with exponential backoff and some randomization
      const delay = Math.min(
        maxDelay, 
        initialDelay * Math.pow(backoffFactor, attempt - 1) * (0.8 + Math.random() * 0.4)
      );
      
      // Log retry information
      onRetry(attempt, error);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Wrapper for Supabase operations with retry capability
 * @param operation Function that performs a Supabase operation
 * @param options Retry configuration options
 * @returns Result of the operation
 */
export async function withSupabaseRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  return fetchWithRetry(operation, {
    maxRetries: 3,
    initialDelay: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    ...options,
    onRetry: (attempt, error) => {
      console.warn(`Supabase operation retry attempt ${attempt}:`, error);
      if (options.onRetry) options.onRetry(attempt, error);
    }
  });
}

/**
 * Check if the error is likely due to network connectivity issues
 */
export function isNetworkError(error: any): boolean {
  return (
    error instanceof TypeError && 
    (error.message === 'Failed to fetch' || 
     error.message === 'NetworkError when attempting to fetch resource' ||
     error.message === 'Network request failed')
  );
}

/**
 * Check if the device has an active internet connection
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
    ? navigator.onLine 
    : true;
}
