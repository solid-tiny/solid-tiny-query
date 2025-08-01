export type QueryKey = string | number;
export type QueryKeys = QueryKey[];

export type QueryFn<T, R = unknown> = (
  info: QueryFnInfo<T, R>
) => T | Promise<T>;

export type QueryFnInfo<T, R = unknown> = {
  value: T | undefined;
  refetching: R | boolean;
};

export type QueryOptions<T, R = unknown> = {
  queryKey: () => QueryKey | QueryKeys | (QueryKey | QueryKeys)[];
  queryFn: QueryFn<T, R>;
  staleTime?: number;
  initialValue?: T;
  enabled?: () => boolean;
  retry?: number;
  /**
   * Optional time in milliseconds to wait before garbage collecting the query.
   *
   * If not provided, use staleTime > 5000 ? staleTime : 5000.
   *
   * If provided, minimum value is 5000.
   *
   * Set to 0 to disable garbage collection.
   */
  gcTime?: number;
};

export type InitialedQueryOptions<T, R = unknown> = Omit<
  QueryOptions<T, R>,
  'initialValue'
> & {
  initialValue: T;
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
  defaultGcTime?: number;
  defaultStaleTime?: number;
};

export type CacheEntry = {
  jsonData: string;
  timestamp: number;
};

export type CacheState = {
  cache: Record<string, CacheEntry>;
  gcConf: Record<string, number>;
  defaultGcTime: number;
  defaultStaleTime: number;
};
