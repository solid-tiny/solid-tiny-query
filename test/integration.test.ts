import { createSignal } from 'solid-js';
import { sleep } from 'solid-tiny-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuery, useQueryClient } from '../src';
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
      await sleep(10);
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
      await sleep(10);
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

  it('retry should work correctly', async ({ onTestFinished }) => {
    onTestFinished(() => {
      // if the event was never called during the test,
      // make sure it's removed before the next test starts
      process.removeAllListeners('unhandledrejection');
    });

    // disable Vitest's rejection handle
    process.on('unhandledRejection', () => {
      // your own handler
    });

    const wrapper = createWrapper();
    let count = 0;
    const queryFn = vi.fn(async () => {
      await sleep(10);
      count++;
      if (count < 4) {
        throw new Error('error');
      }
      return 'data';
    });
    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn,
        retry: 3,
      });
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(queryFn).toBeCalledTimes(1);

    await vi.advanceTimersByTimeAsync(8000);
    expect(query.isError).toBe(false);
    expect(queryFn).toBeCalledTimes(4);
    expect(query.data).toBe('data');
  });

  it('should handle error correctly', async ({ onTestFinished }) => {
    onTestFinished(() => {
      // if the event was never called during the test,
      // make sure it's removed before the next test starts
      process.removeAllListeners('unhandledrejection');
    });

    // disable Vitest's rejection handle
    process.on('unhandledRejection', () => {
      // your own handler
    });

    const wrapper = createWrapper();
    const queryFn = vi.fn(() => 'data').mockRejectedValueOnce('first call');
    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn,
        retry: 0,
      });
    });

    await vi.advanceTimersByTimeAsync(8000);
    expect(query.isError).toBe(true);
    expect(queryFn).toBeCalledTimes(1);

    // should resolve after refetch
    query.refetch();
    await vi.advanceTimersByTimeAsync(1000);
    expect(query.isError).toBe(false);
    expect(queryFn).toBeCalledTimes(2);
    expect(query.data).toBe('data');
  });

  it('should handle retry correctly', async ({ onTestFinished }) => {
    onTestFinished(() => {
      // if the event was never called during the test,
      // make sure it's removed before the next test starts
      process.removeAllListeners('unhandledrejection');
    });

    // disable Vitest's rejection handle
    process.on('unhandledRejection', () => {
      // your own handler
    });

    const handleErrorFn = vi.fn();
    const wrapper = createWrapper({
      onError: handleErrorFn,
    });
    const queryFn = vi.fn().mockRejectedValue('error');
    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn,
        retry: 2,
      });
    });

    await vi.advanceTimersByTimeAsync(80_000);
    expect(query.isError).toBe(true);
    expect(queryFn).toBeCalledTimes(3);
    expect(handleErrorFn).toBeCalledTimes(1);

    // should stop retry when disposed
    query.refetch();
    expect(queryFn).toBeCalledTimes(4);
    wrapper.dispose();
    await vi.advanceTimersByTimeAsync(80_000);
    expect(queryFn).toBeCalledTimes(4);
    expect(handleErrorFn).toBeCalledTimes(1);
    expect(query.isError).toBe(true);
  });

  it('should trigger onError if is settled in hook', async ({
    onTestFinished,
  }) => {
    onTestFinished(() => {
      // if the event was never called during the test,
      // make sure it's removed before the next test starts
      process.removeAllListeners('unhandledrejection');
    });

    // disable Vitest's rejection handle
    process.on('unhandledRejection', () => {
      // your own handler
    });

    const wrapper = createWrapper();
    const queryFn = vi.fn(() => 'data').mockRejectedValueOnce('first call');
    const handleErrorFn = vi.fn();
    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn,
        retry: 0,
        onError: handleErrorFn,
      });
    });
    await vi.advanceTimersByTimeAsync(8000);
    expect(query.isError).toBe(true);
    expect(queryFn).toBeCalledTimes(1);
    expect(handleErrorFn).toBeCalledTimes(1);

    query.refetch();
    await vi.advanceTimersByTimeAsync(1000);
    expect(query.isError).toBe(false);
    expect(handleErrorFn).toBeCalledTimes(1);
  });

  it('should trigger onError if is settled in client', async ({
    onTestFinished,
  }) => {
    onTestFinished(() => {
      // if the event was never called during the test,
      // make sure it's removed before the next test starts
      process.removeAllListeners('unhandledrejection');
    });

    // disable Vitest's rejection handle
    process.on('unhandledRejection', () => {
      // your own handler
    });
    const handleErrorFn = vi.fn();
    const wrapper = createWrapper({
      onError: handleErrorFn,
    });
    const queryFn = vi.fn(() => 'data').mockRejectedValueOnce('first call');

    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn,
        retry: 0,
      });
    });
    await vi.advanceTimersByTimeAsync(8000);
    expect(query.isError).toBe(true);
    expect(queryFn).toBeCalledTimes(1);
    expect(handleErrorFn).toBeCalledTimes(1);
    expect(handleErrorFn).toBeCalledWith('first call', expect.any(Object));

    query.refetch();
    await vi.advanceTimersByTimeAsync(1000);
    expect(query.isError).toBe(false);
    expect(handleErrorFn).toBeCalledTimes(1);
  });

  it('should handle returned error correctly', async ({ onTestFinished }) => {
    onTestFinished(() => {
      // if the event was never called during the test,
      // make sure it's removed before the next test starts
      process.removeAllListeners('unhandledrejection');
    });

    // disable Vitest's rejection handle
    process.on('unhandledRejection', () => {
      // your own handler
    });
    const handleErrorFn = vi.fn();
    const handleErrorOnInstanceFn = vi
      .fn(() => false as false | string)
      .mockReturnValueOnce('instance error');
    const wrapper = createWrapper({
      onError: handleErrorFn,
    });
    const queryFn = vi.fn(() => 'data').mockRejectedValue('first call');

    const query = wrapper.run(() => {
      return createQuery({
        queryKey: () => 'test',
        queryFn,
        retry: 0,
        onError: handleErrorOnInstanceFn,
      });
    });
    await vi.advanceTimersByTimeAsync(8000);
    expect(query.isError).toBe(true);
    expect(queryFn).toBeCalledTimes(1);
    expect(handleErrorFn).toBeCalledTimes(1);
    expect(handleErrorOnInstanceFn).toBeCalledTimes(1);
    expect(handleErrorFn).toBeCalledWith('instance error', expect.any(Object));

    query.refetch();
    await vi.advanceTimersByTimeAsync(1000);
    expect(query.isError).toBe(true);
    expect(handleErrorFn).toBeCalledTimes(1);
    expect(handleErrorOnInstanceFn).toBeCalledTimes(2);
  });
});
