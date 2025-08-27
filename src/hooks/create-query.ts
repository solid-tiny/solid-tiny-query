import { createMemo, createSignal, onCleanup } from 'solid-js';
import { createDebouncedWatch, createWatch, sleep } from 'solid-tiny-utils';
import { queryContext } from '../client';
import type {
  InitialedQueryOptions,
  InitialedQueryResult,
  PlaceholderQueryOptions,
  QueryOptions,
  QueryResult,
} from '../types';
import { isDef } from '../utils';
import { getRealQueryKey } from '../utils/query-utils';

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
  let isCleanedUp = false;
  let isInitialized = false;

  onCleanup(() => {
    isCleanedUp = true;
  });

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

  if (isDef(opts.initialData)) {
    setData(() => opts.initialData);
    isInitialized = true;
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

  const handleFetchError = (error: unknown, tempKey: string) => {
    const res = opts.onError?.(error);

    if (res !== false) {
      staticData.onError?.(res || error, {
        parsedQueryKey: tempKey,
        queryOpts: opts as QueryOptions<unknown>,
      });
    }

    setIsError(true);
  };

  const performFetch = async (
    id: number,
    tempKey: string,
    attempt: number,
    maxRetry: number
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: I tried, I failed
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
        isInitialized = true;
      }

      actions.setCache(tempKey, result);
      setIsError(false);
    } catch (error) {
      if (latestFetchId !== id) {
        return; // Ignore stale fetch
      }

      if (attempt < maxRetry) {
        await sleep(1400);
        if (!isCleanedUp) {
          return await performFetch(id, tempKey, attempt + 1, maxRetry);
        }
      }

      handleFetchError(error, tempKey);
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
      if (isEnabled && !isInitialized) {
        refetch();
      }
    },
    {
      defer: true,
    }
  );

  const onKeyChange = (keyValue: string) => {
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
  };

  createDebouncedWatch(realKey, onKeyChange, {
    delay: 100,
  });

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
