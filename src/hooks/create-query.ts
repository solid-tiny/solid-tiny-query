import { createMemo, createSignal } from 'solid-js';
import { queryContext } from '../client';
import type {
  InitialedQueryOptions,
  InitialedQueryResult,
  PlaceholderQueryOptions,
  QueryOptions,
  QueryResult,
} from '../types';
import { createWatch, debounce, isDef } from '../utils';
import { delay, getRealQueryKey } from '../utils/query-utils';

export function createQuery<T>(
  opts: InitialedQueryOptions<T>
): InitialedQueryResult<T>;
export function createQuery<T>(
  opts: PlaceholderQueryOptions<T>
): InitialedQueryResult<T>;
export function createQuery<T>(opts: QueryOptions<T>): QueryResult<T>;
export function createQuery<T>(
  opts: QueryOptions<T> | InitialedQueryOptions<T> | PlaceholderQueryOptions<T>
): QueryResult<T> | InitialedQueryResult<T> {
  const [state, actions, staticData] = queryContext.useContext();

  const realKey = createMemo(() => {
    return getRealQueryKey(opts.queryKey());
  });

  const cacheValue = createMemo(() => {
    const cachedValue = actions.getCache(realKey(), opts.staleTime);
    return isDef(cachedValue) ? (cachedValue as T) : undefined;
  });

  const [data, setData] = createSignal<T | undefined>(opts.placeholderData);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [isError, setIsError] = createSignal<boolean>(false);
  const [initialized, setInitialized] = createSignal<boolean>(false);

  if (isDef(opts.initialData)) {
    setData(() => opts.initialData);
    setInitialized(true);
    actions.setCache(realKey(), opts.initialData, opts.initialDataUpdatedAt);
  }

  let historyKeys = {} as Record<string, boolean>;
  let latestFetchId = 0;

  createWatch(realKey, (key) => {
    if (historyKeys[key]) {
      return;
    }
    historyKeys[key] = true;
  });

  const clearCache = () => {
    for (const key in historyKeys) {
      if (key in historyKeys) {
        actions.removeCache(key);
      }
    }
    historyKeys = {};
  };

  const enabled = createMemo(() => {
    return opts.enabled ? opts.enabled() : true;
  });

  const performFetch = async (
    id: number,
    tempKey: string,
    attempt: number,
    maxRetry: number
  ): Promise<void> => {
    try {
      const result = await opts.queryFn({
        value: data(),
        refetching: isLoading(),
      });

      if (latestFetchId !== id) {
        return; // Ignore stale fetch
      }

      if (tempKey === realKey()) {
        setData(() => result);
        if (!initialized()) {
          setInitialized(true);
        }
      }

      actions.setCache(tempKey, result);
      setIsError(false);
    } catch (error) {
      if (latestFetchId !== id) {
        return; // Ignore stale fetch
      }

      if (attempt < maxRetry) {
        await delay(1400);
        return await performFetch(id, tempKey, attempt + 1, maxRetry);
      }

      setIsError(true);
      throw error;
    }
  };

  const refetch = async () => {
    if (!enabled()) {
      return;
    }

    setIsLoading(true);

    const id = Date.now();
    latestFetchId = id;
    const maxRetry = opts.retry ?? 2;

    try {
      await performFetch(id, realKey(), 0, maxRetry);
    } finally {
      if (latestFetchId === id) {
        setIsLoading(false);
      }
    }
  };

  createWatch(
    enabled,
    (isEnabled) => {
      if (isEnabled && !initialized()) {
        refetch();
      }
    },
    {
      defer: true,
    }
  );

  const debouncedKeyChange = debounce((keyValue: string) => {
    const cachedValue = cacheValue();

    if (isDef(cachedValue)) {
      setData(() => cachedValue);
    } else {
      refetch();
    }

    // Configure garbage collection
    const currentGcTime = state.gcConf[keyValue] || staticData.gcTime;
    const staleTime = opts.staleTime || 0;
    if (staleTime > currentGcTime) {
      actions.setState('gcConf', keyValue, staleTime);
    }
  }, 100);

  createWatch(realKey, debouncedKeyChange);

  createWatch(cacheValue, (v) => {
    if (isDef(v) && v !== data() && !isLoading() && !isError()) {
      setData(() => v);
    }
  });

  return {
    get data() {
      return data() as T;
    },
    get isLoading() {
      return isLoading();
    },
    get isError() {
      return isError();
    },
    refetch,
    clearCache,
  };
}
