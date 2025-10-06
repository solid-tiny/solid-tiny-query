import type { Accessor } from 'solid-js';
import type { Maybe } from '../utils';

export type QueryKey = string | number | undefined | null | object;
export type QueryKeys = QueryKey[];

export type QueryFn<T> = (info: QueryFnInfo<T>) => T | Promise<T>;

export type QueryFnInfo<T> = {
  value: T | undefined;
  refetching: boolean;
};

export type QueryOptions<T> = {
  queryKey: Accessor<QueryKey | QueryKeys | (QueryKey | QueryKeys)[]>;
  queryFn: QueryFn<T>;
  staleTime?: number;
  /**
   * Initial data will be treated as normal fetched result. Which means it will
   * be cached at first and prevent the first fetch.
   *
   * If you want to use initial data as a placeholder, use `placeholderData` instead
   *
   */
  initialData?: T;
  /**
   * Set the timestamp when cache initialData
   *
   * @default Date.now()
   */
  initialDataUpdatedAt?: number;
  /**
   * Placeholder data will be used at the query's first refetching. It's mainly
   * for the initial display of the query data.
   *
   * It will not be cached and will not prevent the first fetch.
   */
  placeholderData?: T;
  enabled?: Accessor<boolean>;
  retry?: number;
  onError?: (error: unknown) => Maybe<Error | string | false>;
};

export type InitialedQueryOptions<T> = Omit<QueryOptions<T>, 'initialData'> & {
  initialData: T;
};

export type PlaceholderQueryOptions<T> = Omit<
  QueryOptions<T>,
  'placeholderData'
> & {
  placeholderData: T;
};

export type QueryResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
  clearCache: () => void;
};

export type InitialedQueryResult<T> = Omit<QueryResult<T>, 'data'> & {
  data: T;
};

export type QueryClientOptions = {
  defaultStaleTime?: number;
  onError?: (
    error: unknown,
    info: {
      parsedQueryKey: string;
      queryOpts: QueryOptions<unknown>;
    }
  ) => void;
};

export type CacheEntry = {
  jsonData: string;
  timestamp: number;
};
