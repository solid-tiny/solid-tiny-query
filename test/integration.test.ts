import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuery, useQueryClient } from '../src';
import { delay } from '../src/utils/query-utils';
import { createWrapper } from './common';

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('set custom default stale time', async () => {
    const wrapper = createWrapper({ defaultStaleTime: 5000 });
    const [state, actions] = wrapper.run(() => useQueryClient());
    expect(state.defaultStaleTime).toBe(5000);

    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn: async () => 'data',
      });
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(query.data).toBe('data');
    expect(actions.getCache('test', -1)).toBe('data');

    const query2 = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn: async () => 'data2',
      });
    });
    await vi.advanceTimersByTimeAsync(100);
    // second query should use the cached data
    expect(query2.data).toBe('data');
  });

  it('clear cache should work correctly', async () => {
    const wrapper = createWrapper();
    const [, actions] = wrapper.run(() => useQueryClient());

    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn: async () => 'data',
      });
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(query.data).toBe('data');
    expect(actions.getCache('test', -1)).toBe('data');

    query.clearCache();
    expect(actions.getCache('test', -1)).toBeNull();
  });

  it('clear cache with dynamic key', async () => {
    const wrapper = createWrapper();
    const [count, setCount] = createSignal(1);
    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => `test-${count()}`,
        queryFn: async () => `data-${count()}`,
      });
    });
    const [state] = wrapper.run(() => useQueryClient());
    const id = setInterval(() => {
      setCount((c) => c + 1);
      if (count() > 6) {
        clearInterval(id);
      }
    }, 1000);
    await vi.advanceTimersByTimeAsync(8000);
    expect(Object.keys(state.cache).length).toBe(7);
    query.clearCache();
    expect(Object.keys(state.cache).length).toBe(0);
  });

  it('query with dynamic key should work correctly', async () => {
    const wrapper = createWrapper();
    const [count, setCount] = createSignal(1);
    const queryFn = vi.fn(async () => {
      await delay(10);
      return `data-${count()}`;
    });

    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => `test-${count()}`,
        queryFn,
      });
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(query.data).toBe('data-1');
    expect(queryFn).toBeCalledTimes(1);

    setCount(2);
    await vi.advanceTimersByTimeAsync(500);
    expect(query.data).toBe('data-2');
    expect(queryFn).toBeCalledTimes(2);
  });

  it('enabled should works correctly', async () => {
    const wrapper = createWrapper();
    const queryFn = vi.fn(async () => {
      await delay(10);
      return 'data';
    });
    const [enabled, setEnabled] = createSignal(false);

    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn,
        enabled,
      });
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(query.data).toBeUndefined();
    expect(queryFn).not.toBeCalled();
    await query.refetch();
    expect(query.data).toBeUndefined();
    expect(queryFn).not.toBeCalled();

    setEnabled(true);
    await vi.advanceTimersByTimeAsync(500);
    expect(query.data).toBe('data');
    expect(queryFn).toBeCalledTimes(1);
  });
});
