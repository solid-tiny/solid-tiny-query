// Export types

export { createQueryClient, useQueryClient } from './client';

// Export main functions
export { createQuery } from './hooks/createQuery';
export type {
  CacheEntry,
  CacheState,
  InitialedQueryOptions,
  InitialedQueryResult,
  QueryClientOptions,
  QueryFn,
  QueryFnInfo,
  QueryKey,
  QueryKeys,
  QueryOptions,
  QueryResult,
} from './types';

// Export utilities
export { getRealQueryKey } from './utils/query-utils';
