import type { QueryKey, QueryKeys } from '../types';

/**
 * Convert a query key or array of keys into a single string representation
 */
export function getRealQueryKey(
  key: QueryKey | QueryKeys | (QueryKey | QueryKeys)[]
): string {
  if (Array.isArray(key)) {
    return key.flat().sort().join('-');
  }
  return key.toString();
}

/**
 * Create a delay promise for retry logic
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate the default garbage collection time based on stale time
 */
export function getDefaultGcTime(staleTime?: number): number {
  return staleTime && staleTime > 5000 ? staleTime : 5000;
}
