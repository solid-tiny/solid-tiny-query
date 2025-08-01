import { debounce } from '@solid-primitives/scheduled';
import { createMemo, createSignal } from 'solid-js';
import { queryContext } from '../client';
import type {
  InitialedQueryOptions,
  InitialedQueryResult,
  QueryOptions,
  QueryResult,
} from '../types';
import { createWatch, isDef } from '../utils';
import { delay, getDefaultGcTime, getRealQueryKey } from '../utils/query-utils';

export function createQuery<T, R = unknown>(
  opts: InitialedQueryOptions<T, R>
): InitialedQueryResult<T>;
export function createQuery<T, R = unknown>(
  opts: QueryOptions<T, R>
): QueryResult<T>;
export function createQuery<T, R = unknown>(
  opts: QueryOptions<T, R> | InitialedQueryOptions<T, R>
): QueryResult<T> | InitialedQueryResult<T> {
  const [, actions] = queryContext.useContext();

  const realKey = createMemo(() => {
    return getRealQueryKey(opts.queryKey());
  });

  const cacheValue = createMemo(() => {
    const cachedValue = actions.getCache(realKey(), opts.staleTime);
    return cachedValue === null ? undefined : (cachedValue as T);
  });

  const [data, setData] = createSignal<T | undefined>(opts.initialValue);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [isError, setIsError] = createSignal<boolean>(false);
  const [initialized, setInitialized] = createSignal<boolean>(false);

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
    setIsError(false);

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

  const debounceKeyChange = debounce((keyValue: string) => {
    const cachedValue = cacheValue();

    if (isDef(cachedValue)) {
      setData(() => cachedValue);
    } else {
      refetch();
    }

    // Configure garbage collection
    if (isDef(opts.gcTime)) {
      if (opts.gcTime === 0) {
        actions.setState('gcConf', keyValue, 0 as never);
      } else {
        actions.setState(
          'gcConf',
          keyValue,
          Math.max(opts.gcTime, 5000) as never
        );
      }
    } else {
      actions.setState(
        'gcConf',
        keyValue,
        getDefaultGcTime(opts.staleTime) as never
      );
    }
  }, 100);

  createWatch(realKey, debounceKeyChange);

  createWatch(cacheValue, (v) => {
    if (isDef(v) && v !== data()) {
      setData(() => v);
      setIsLoading(false);
      setIsError(false);
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
