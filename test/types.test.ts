import { describe, expect, it } from 'vitest';
import type {
  InitialedQueryOptions,
  InitialedQueryResult,
  QueryFn,
  QueryFnInfo,
  QueryKey,
  QueryKeys,
  QueryOptions,
  QueryResult,
} from '../src/types';

describe('Types', () => {
  describe('QueryKey and QueryKeys', () => {
    it('should accept valid query key types', () => {
      const stringKey: QueryKey = 'user';
      const numberKey: QueryKey = 123;
      const arrayKeys: QueryKeys = ['user', 'profile'];

      expect(typeof stringKey).toBe('string');
      expect(typeof numberKey).toBe('number');
      expect(Array.isArray(arrayKeys)).toBe(true);
    });
  });

  describe('QueryOptions', () => {
    it('should have correct structure for query options', () => {
      const mockQueryFn: QueryFn<string> = ({ value }) => {
        // Use parameters to satisfy TypeScript
        return Promise.resolve(value ? `${value}-updated` : 'new-data');
      };

      const options: QueryOptions<string> = {
        queryKey: () => 'test',
        queryFn: mockQueryFn,
        staleTime: 5000,
        enabled: () => true,
        retry: 3,
        gcTime: 10_000,
      };

      expect(typeof options.queryKey).toBe('function');
      expect(typeof options.queryFn).toBe('function');
      expect(options.staleTime).toBe(5000);
      expect(options.retry).toBe(3);
      expect(options.gcTime).toBe(10_000);
    });

    it('should work with minimal options', () => {
      const mockQueryFn: QueryFn<string> = async () => 'data';

      const options: QueryOptions<string> = {
        queryKey: () => 'test',
        queryFn: mockQueryFn,
      };

      expect(typeof options.queryKey).toBe('function');
      expect(typeof options.queryFn).toBe('function');
    });
  });

  describe('InitialedQueryOptions', () => {
    it('should require initialValue', () => {
      const mockQueryFn: QueryFn<string> = async () => 'data';

      const options: InitialedQueryOptions<string> = {
        queryKey: () => 'test',
        queryFn: mockQueryFn,
        initialValue: 'initial',
      };

      expect(options.initialValue).toBe('initial');
    });
  });

  describe('QueryResult types', () => {
    it('should have correct QueryResult structure', () => {
      // We can't actually test the runtime structure here since these are types,
      // but we can test that the types compile correctly
      type TestResult = QueryResult<string>;

      // These type assertions will fail compilation if types are wrong
      const mockResult = {} as TestResult;

      // Check that all required properties exist in the type
      expect(
        typeof mockResult.data === 'string' || mockResult.data === undefined
      ).toBe(true);
      expect(typeof mockResult.isLoading).toBe('boolean');
      expect(typeof mockResult.isError).toBe('boolean');
      expect(typeof mockResult.refetch).toBe('function');
      expect(typeof mockResult.clearCache).toBe('function');
    });

    it('should have correct InitialedQueryResult structure', () => {
      type TestResult = InitialedQueryResult<string>;

      const mockResult = {} as TestResult;

      // For InitialedQueryResult, data should be T, not T | undefined
      expect(typeof mockResult.data).toBe('string');
      expect(typeof mockResult.isLoading).toBe('boolean');
      expect(typeof mockResult.isError).toBe('boolean');
      expect(typeof mockResult.refetch).toBe('function');
      expect(typeof mockResult.clearCache).toBe('function');
    });
  });

  describe('QueryFn and QueryFnInfo', () => {
    it('should work with correct QueryFnInfo structure', () => {
      const structureQueryFn: QueryFn<string, boolean> = (
        queryInfo: QueryFnInfo<string, boolean>
      ) => {
        // Test that info has the correct structure
        expect(
          typeof queryInfo.value === 'string' || queryInfo.value === undefined
        ).toBe(true);
        expect(
          typeof queryInfo.refetching === 'boolean' ||
            typeof queryInfo.refetching === 'boolean'
        ).toBe(true);

        return Promise.resolve('result');
      };

      // Test that the function can be called with proper info
      const info: QueryFnInfo<string, boolean> = {
        value: 'test',
        refetching: true,
      };

      expect(structureQueryFn(info)).resolves.toBe('result');
    });

    it('should handle undefined value in QueryFnInfo', () => {
      const testQueryFn2: QueryFn<string> = (info) => {
        if (info.value === undefined) {
          return Promise.resolve('no-value');
        }
        return Promise.resolve(`has-value: ${info.value}`);
      };

      const infoWithoutValue: QueryFnInfo<string> = {
        value: undefined,
        refetching: false,
      };

      const infoWithValue: QueryFnInfo<string> = {
        value: 'existing',
        refetching: true,
      };

      expect(testQueryFn2(infoWithoutValue)).resolves.toBe('no-value');
      expect(testQueryFn2(infoWithValue)).resolves.toBe('has-value: existing');
    });
  });
});
