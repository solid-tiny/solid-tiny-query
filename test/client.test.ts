import { createRoot } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../src/client';

describe('Query Client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createQueryClient', () => {
    it('should create a query client with default options', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [state] = client.value;

        expect(state.cache).toEqual({});
        expect(state.gcConf).toEqual({});
        expect(state.defaultStaleTime).toBe(0);
      });
    });

    it('should create a query client with custom options', () => {
      createRoot(() => {
        const client = createQueryClient({
          defaultStaleTime: 1000,
        });
        const [state] = client.value;

        expect(state.defaultStaleTime).toBe(1000);
      });
    });
  });

  describe('Cache Operations', () => {
    it('should set and get cache values', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [state, actions] = client.value;

        // Set cache value
        actions.setCache('user:1', { name: 'John', id: 1 });

        // Get cache value
        const cached = actions.getCache('user:1', -1);
        expect(cached).toEqual({ name: 'John', id: 1 });

        // Check cache state
        expect(state.cache['user:1']).toBeDefined();
        expect(state.cache['user:1'].jsonData).toBe(
          JSON.stringify({ name: 'John', id: 1 })
        );
      });
    });

    it('should return null for non-existent cache keys', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [, actions] = client.value;

        const cached = actions.getCache('non-existent');
        expect(cached).toBeNull();
      });
    });

    it('should handle stale time correctly', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [, actions] = client.value;

        // Set cache with custom timestamp
        const pastTime = Date.now() - 2000; // 2 seconds ago
        actions.setCache('user:1', { name: 'John' }, pastTime);

        // Should return value when stale time is greater than age
        const fresh = actions.getCache('user:1', 3000);
        expect(fresh).toEqual({ name: 'John' });

        // Should return null when stale time is less than age
        const stale = actions.getCache('user:1', 1000);
        expect(stale).toBeNull();
      });
    });

    it('should handle stale time of 0 by always returning null', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [, actions] = client.value;

        actions.setCache('user:1', { name: 'John' });

        // With stale time 0, should always return null
        const result = actions.getCache('user:1', 0);
        expect(result).toBeNull();
      });
    });

    it('should remove corrupted cache entries', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [state, actions] = client.value;

        // Manually corrupt cache data
        actions.setState('cache', 'corrupted', {
          jsonData: 'invalid json{',
          timestamp: Date.now(),
        });

        // Getting corrupted data should return null and remove the entry
        const result = actions.getCache('corrupted', -1);
        expect(result).toBeNull();
        expect(state.cache.corrupted).toBeUndefined();
      });
    });

    it('should remove cache entries', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [state, actions] = client.value;

        // Set cache value
        actions.setCache('user:1', { name: 'John' });
        expect(state.cache['user:1']).toBeDefined();

        // Remove cache value
        actions.removeCache('user:1');
        expect(state.cache['user:1']).toBeUndefined();
      });
    });

    it('should handle array query keys', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [, actions] = client.value;

        actions.setCache(['user', 'profile', 1], { name: 'John' });

        const cached = actions.getCache(['user', 'profile', 1], -1);
        expect(cached).toEqual({ name: 'John' });
      });
    });
  });

  describe('Garbage Collection', () => {
    it('should garbage collect stale entries', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [state, actions] = client.value;

        // Set old cache entries
        const oldTime = Date.now() - 10_000; // 10 seconds ago
        actions.setState('cache', 'old-key', {
          jsonData: '{}',
          timestamp: oldTime,
        });
        actions.setState('gcConf', 'old-key', 5000); // 5 second gc time

        // Set fresh cache entry
        actions.setState('cache', 'fresh-key', {
          jsonData: '{}',
          timestamp: Date.now(),
        });
        actions.setState('gcConf', 'fresh-key', 15_000); // 15 second gc time

        // Run garbage collection
        actions.gc();

        // Old entry should be removed, fresh entry should remain
        expect(state.cache['old-key']).toBeUndefined();
        expect(state.cache['fresh-key']).toBeDefined();
      });
    });
  });

  describe('Context Integration', () => {
    it('should integrate with solid-tiny-context properly', () => {
      createRoot(() => {
        const client = createQueryClient();
        const [state, actions] = client.value;

        // Verify the context provides the expected API
        expect(state).toBeDefined();
        expect(actions).toBeDefined();
        expect(typeof actions.setCache).toBe('function');
        expect(typeof actions.getCache).toBe('function');
        expect(typeof actions.removeCache).toBe('function');
        expect(typeof actions.gc).toBe('function');
      });
    });
  });
});
