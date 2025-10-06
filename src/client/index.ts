import { batch } from 'solid-js';
import { createComponentState } from 'solid-tiny-context';
import type {
  CacheEntry,
  QueryClientOptions,
  QueryKey,
  QueryKeys,
} from '../types';
import { isDef } from '../utils';
import { getRealQueryKey } from '../utils/query-utils';

export const queryContext = createComponentState({
  state: () => ({
    cache: {} as Record<string, CacheEntry>,
    gcConf: {} as Record<string, number>,
    defaultStaleTime: 0,
    defaultRetry: 3,
    defaultRetryDelay: 1500,
  }),
  methods: {
    /**
     * Reactively get the current cache state.
     * Get a cache value by key, with an optional stale time.
     * If the value is stale or does not exist, it returns null.
     *
     * if staleTime < 0, it will always return current cache.
     *
     * if staleTime === 0, it will return null.
     *
     * if staleTime is not provided, it will use the default stale time.
     */
    getCache<T>(key: QueryKey | QueryKeys, staleTime?: number): T | null {
      const realStaleTime = isDef(staleTime)
        ? staleTime
        : this.state.defaultStaleTime;

      if (realStaleTime === 0) {
        return null;
      }

      const realKey = getRealQueryKey(key);
      const value = this.state.cache[realKey];

      if (!value?.jsonData) {
        return null;
      }

      try {
        if (Date.now() - value.timestamp > realStaleTime && realStaleTime > 0) {
          return null;
        }
        return JSON.parse(value.jsonData) as T;
      } catch {
        this.actions.removeCache(realKey);
        return null;
      }
    },

    /**
     * Set a cache value with an optional timestamp.
     */
    setCache<T = string>(
      key: QueryKey | QueryKeys,
      value: T,
      timestamp?: number
    ): void {
      const realKey = getRealQueryKey(key);
      this.actions.setState('cache', realKey, {
        jsonData: JSON.stringify(value),
        timestamp: timestamp ?? Date.now(),
      });
    },

    /**
     * Remove a cache entry by key.
     */
    removeCache(key: QueryKey | QueryKeys): void {
      const realKey = getRealQueryKey(key);
      batch(() => {
        // biome-ignore lint/style/noNonNullAssertion: I need this to remove the cache entry
        this.actions.setState('cache', realKey, undefined!);
      });
    },

    /**
     * Garbage collect stale cache entries
     */
    gc() {
      const now = Date.now();
      const cache = this.state.cache;

      for (const [key, cachedData] of Object.entries(cache)) {
        const gcTime = this.state.gcConf[key] || this.nowrapData.gcTime;
        if (gcTime > 0 && now - cachedData.timestamp > gcTime) {
          this.actions.removeCache(key);
        }
      }
    },
  },
  nowrapData: () => ({
    gcInterval: 1000 * 60, // Garbage collection interval
    gcTime: 5 * 1000 * 60, // Default garbage collection time
    onError: undefined as QueryClientOptions['onError'] | undefined,
  }),
});

/**
 * Create a new query client with optional configuration
 */
export function createQueryClient(opts?: QueryClientOptions) {
  const Context = queryContext.initial({
    defaultStaleTime: () => opts?.defaultStaleTime,
    defaultRetry: () => opts?.defaultRetry,
    defaultRetryDelay: () => opts?.defaultRetryDelay,
  });

  const [, actions, staticData] = Context.value;
  staticData.onError = opts?.onError;

  // Set up garbage collection interval
  setInterval(() => actions.gc(), staticData.gcInterval);

  return Context;
}

/**
 * Hook to access the query client from context
 */
export function useQueryClient() {
  const [state, actions] = queryContext.useContext();
  return [state, actions] as const;
}
