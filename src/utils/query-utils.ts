import type { QueryKey, QueryKeys } from '../types';

function parseKey(key: QueryKey) {
  return `${key}`;
}

/**
 * Convert a query key or array of keys into a single string representation
 */
export function getRealQueryKey(
  key: QueryKey | QueryKeys | (QueryKey | QueryKeys)[]
): string {
  if (Array.isArray(key)) {
    let res = '';
    const flatSorted = key.flat().sort();
    for (const k of flatSorted) {
      res += parseKey(k);
    }
    return res;
  }
  return parseKey(key);
}

/**
 * Create a delay promise for retry logic
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
