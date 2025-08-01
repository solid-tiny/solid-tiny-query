import { createRoot, createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../src/client';
import { createQuery } from '../src/hooks/createQuery';

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create and use a complete query client with hooks', () => {
    createRoot(() => {
      const client = createQueryClient({
        defaultGcTime: 5000,
        defaultStaleTime: 1000,
      });

      expect(client).toBeDefined();
      const [state, actions] = client.value;

      // Test client state
      expect(state.defaultGcTime).toBe(5000);
      expect(state.defaultStaleTime).toBe(1000);
      expect(state.cache).toEqual({});

      // Test cache operations
      actions.setCache('user:1', { name: 'John', age: 30 });
      const cached = actions.getCache('user:1');
      expect(cached).toEqual({ name: 'John', age: 30 });

      // Test stale time behavior
      const fresh = actions.getCache('user:1', 2000);
      expect(fresh).toEqual({ name: 'John', age: 30 });

      // Test query creation
      const query = createQuery({
        queryKey: () => 'test-query',
        queryFn: vi.fn().mockResolvedValue('test-data'),
        initialValue: 'initial',
      });

      expect(query.data).toBe('initial');
      expect(query.isLoading).toBe(false);
      expect(query.isError).toBe(false);
      expect(typeof query.refetch).toBe('function');
      expect(typeof query.clearCache).toBe('function');
    });
  });

  it('should handle reactive query keys', () => {
    createRoot(() => {
      createQueryClient();

      const [userId, setUserId] = createSignal(1);
      const queryFn = vi.fn().mockResolvedValue('user-data');

      const query = createQuery({
        queryKey: () => `user:${userId()}`,
        queryFn,
        initialValue: 'loading...',
      });

      expect(query.data).toBe('loading...');

      // Change the user ID
      setUserId(2);
      vi.runAllTimers();

      // Should have been called for the new key
      expect(queryFn).toHaveBeenCalled();
    });
  });

  it('should handle garbage collection properly', () => {
    createRoot(() => {
      const client = createQueryClient();
      const [state, actions] = client.value;

      // Add some test data with different timestamps
      const now = Date.now();
      const oldTime = now - 10_000; // 10 seconds ago

      // Add old entry that should be garbage collected
      actions.setState('cache', 'old-key', {
        jsonData: JSON.stringify({ data: 'old' }),
        timestamp: oldTime,
      });
      actions.setState('gcConf', 'old-key', 5000); // 5 second gc time

      // Add fresh entry that should not be garbage collected
      actions.setState('cache', 'fresh-key', {
        jsonData: JSON.stringify({ data: 'fresh' }),
        timestamp: now,
      });
      actions.setState('gcConf', 'fresh-key', 15_000); // 15 second gc time

      // Run garbage collection
      actions.gc();

      // Check results
      expect(state.cache['old-key']).toBeUndefined();
      expect(state.cache['fresh-key']).toBeDefined();
    });
  });

  it('should calculate minimum gc time correctly', () => {
    createRoot(() => {
      const client = createQueryClient({ defaultGcTime: 10_000 });
      const [state, actions] = client.value;

      // Add entries with different gc times
      actions.setState('cache', 'key1', {
        jsonData: '{}',
        timestamp: Date.now(),
      });
      actions.setState('cache', 'key2', {
        jsonData: '{}',
        timestamp: Date.now(),
      });
      actions.setState('gcConf', 'key1', 8000);
      actions.setState('gcConf', 'key2', 3000);

      expect(state.minGcTime).toBe(3000);

      // Remove the key with minimum time
      actions.removeCache('key2');

      expect(state.minGcTime).toBe(8000);
    });
  });

  it('should handle corrupted cache gracefully', () => {
    createRoot(() => {
      const client = createQueryClient();
      const [state, actions] = client.value;

      // Manually add corrupted data
      actions.setState('cache', 'corrupted', {
        jsonData: 'invalid json{',
        timestamp: Date.now(),
      });

      // Try to get corrupted data
      const result = actions.getCache('corrupted');

      // Should return null and clean up
      expect(result).toBeNull();
      expect(state.cache.corrupted).toBeUndefined();
    });
  });

  it('should handle disabled queries', () => {
    createRoot(() => {
      createQueryClient();

      const [enabled, setEnabled] = createSignal(false);
      const queryFn = vi.fn().mockResolvedValue('data');

      createQuery({
        queryKey: () => 'disabled-test',
        queryFn,
        enabled,
      });

      // Should not fetch when disabled
      vi.runAllTimers();
      expect(queryFn).not.toHaveBeenCalled();

      // Enable the query
      setEnabled(true);
      vi.runAllTimers();

      // Now it should fetch
      expect(queryFn).toHaveBeenCalled();
    });
  });
});
