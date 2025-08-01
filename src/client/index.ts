import { createComponentState } from 'solid-tiny-context';
import type {
  CacheState,
  QueryClientOptions,
  QueryKey,
  QueryKeys,
} from '../types';
import { createInterval, isDef } from '../utils';
import { getRealQueryKey } from '../utils/query-utils';

export const queryContext = createComponentState({
  state: (): CacheState => ({
    cache: {},
    gcConf: {},
    defaultGcTime: 1000 * 60 * 8, // 8 minutes
    defaultStaleTime: 0,
  }),

  getters: {
    minGcTime() {
      const gcConf = this.state.gcConf;
      const cache = this.state.cache;
      let minTime = this.state.defaultGcTime;

      for (const key in cache) {
        if (key in cache) {
          const gcTime = gcConf[key];
          if (gcTime > 0 && gcTime < minTime) {
            minTime = gcTime;
          }
        }
      }

      return minTime;
    },
  },

  methods: {
    /**
     * Reactively get the current cache state.
     * Get a cache value by key, with an optional stale time.
     * If the value is stale or does not exist, it returns null.
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
      // Remove from cache by setting to a special null value that will be filtered
      const newCache = { ...this.state.cache };
      const newGcConf = { ...this.state.gcConf };
      delete newCache[realKey];
      delete newGcConf[realKey];
      this.actions.setState('cache', () => newCache);
      this.actions.setState('gcConf', () => newGcConf);
    },

    /**
     * Garbage collect stale cache entries
     */
    gc() {
      const now = Date.now();
      const gcConf = this.state.gcConf;
      const cache = this.state.cache;

      for (const key in cache) {
        if (key in cache) {
          const gcTime = gcConf[key];
          if (gcTime > 0 && now - cache[key].timestamp > gcTime) {
            this.actions.removeCache(key);
          }
        }
      }
    },
  },
});

/**
 * Create a new query client with optional configuration
 */
export function createQueryClient(opts?: QueryClientOptions) {
  const Context = queryContext.initial({
    defaultGcTime: () => opts?.defaultGcTime,
    defaultStaleTime: () => opts?.defaultStaleTime,
  });

  const [state, actions] = Context.value;

  // Set up garbage collection interval
  createInterval(actions.gc, () => state.minGcTime);

  return Context;
}

/**
 * Hook to access the query client from context
 */
export function useQueryClient() {
  const [state, actions] = queryContext.useContext();
  return [state, actions] as const;
}
