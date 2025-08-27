import { sleep } from 'solid-tiny-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useQueryClient } from '../src';
import { createQuery } from '../src/hooks/create-query';
import { createWrapper } from './common';

describe('createQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  describe('Basic Functionality', () => {
    it('should create a query with initial data', async () => {
      const wrapper = createWrapper();
      wrapper.dispose();
      const queryFn = vi.fn(async () => {
        await sleep(50);
        return 'data';
      });
      const query = wrapper.run(() => {
        return createQuery({
          queryKey: () => 'test',
          queryFn,
          initialData: 'initial',
          staleTime: 1000,
        });
      });

      await vi.advanceTimersByTimeAsync(500);
      expect(query.data).toBe('initial');
      const [, actions] = wrapper.run(() => useQueryClient());
      expect(actions.getCache('test', -1)).toBe('initial');
      expect(queryFn).not.toHaveBeenCalled();

      query.refetch();
      await vi.advanceTimersByTimeAsync(80);
      expect(query.data).toBe('data');
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('should create a query without initial data', async () => {
      const wrapper = createWrapper();
      const queryFn = vi.fn(async () => {
        await sleep(80);
        return 'data';
      });
      const query = wrapper.run(() => {
        return createQuery({
          queryKey: () => 'test',
          queryFn,
          staleTime: 1000,
        });
      });

      await vi.advanceTimersByTimeAsync(100);
      expect(query.data).toBeUndefined();
      const [, actions] = wrapper.run(() => useQueryClient());
      expect(actions.getCache('test', -1)).toBeNull();
      expect(queryFn).toBeCalledTimes(1);

      query.refetch();
      await vi.advanceTimersByTimeAsync(100);
      expect(query.data).toBe('data');
      expect(queryFn).toBeCalledTimes(2);
    });

    it('should create a query with placeholder data', async () => {
      const wrapper = createWrapper();
      const queryFn = vi.fn(async () => {
        await sleep(80);
        return 'data';
      });
      const query = wrapper.run(() => {
        return createQuery({
          queryKey: () => 'test',
          queryFn,
          placeholderData: 'placeholder',
          staleTime: 1000,
        });
      });

      await vi.advanceTimersByTimeAsync(110);
      expect(query.data).toBe('placeholder');
      const [, actions] = wrapper.run(() => useQueryClient());
      expect(actions.getCache('test', -1)).toBeNull();
      expect(queryFn).toBeCalledTimes(1);

      query.refetch();
      await vi.advanceTimersByTimeAsync(100);
      expect(query.data).toBe('data');
      expect(queryFn).toBeCalledTimes(2);
    });

    it('should create a query with a custom stale time', async () => {
      const wrapper = createWrapper();
      let count = 1;
      const queryFn = vi.fn(async () => {
        await sleep(50);
        return `data-${count++}`;
      });
      // first query
      const firstQuery = wrapper.run(() => {
        return createQuery({
          queryKey: () => 'test',
          queryFn,
          staleTime: 1000 * 60,
        });
      });

      await vi.advanceTimersByTimeAsync(180);
      const [, actions] = wrapper.run(() => useQueryClient());
      // make sure data is cached
      expect(actions.getCache('test', -1)).toBe('data-1');

      // second query with stale time
      const secondQuery = wrapper.run(() => {
        return createQuery({
          queryKey: () => 'test',
          queryFn,
          staleTime: 5000,
        });
      });

      await vi.advanceTimersByTimeAsync(150);
      expect(secondQuery.data).toBe('data-1');
      secondQuery.refetch();
      await vi.advanceTimersByTimeAsync(100);
      expect(secondQuery.data).toBe('data-2');
      expect(queryFn).toBeCalledTimes(2);

      // first query should be updated as well
      expect(firstQuery.data).toBe('data-2');
    });

    it('should create a query without stale time', async () => {
      const wrapper = createWrapper();
      const queryFn = vi.fn(async () => {
        await sleep(10);
        return 'data';
      });
      const query = wrapper.run(() => {
        return createQuery({
          queryKey: () => 'test',
          queryFn,
        });
      });

      await vi.advanceTimersByTimeAsync(150);
      expect(query.data).toBe('data');
      expect(queryFn).toBeCalledTimes(1);

      const [, actions] = wrapper.run(() => useQueryClient());
      expect(actions.getCache('test', -1)).toBe('data');

      const queryFn2 = vi.fn(async () => {
        await sleep(10);
        return 'data2';
      });
      const query2 = wrapper.run(() => {
        return createQuery({
          queryKey: () => 'test',
          queryFn: queryFn2,
        });
      });
      await vi.advanceTimersByTimeAsync(150);
      expect(query2.data).toBe('data2');
      expect(queryFn2).toBeCalledTimes(1);
      expect(actions.getCache('test', -1)).toBe('data2');
    });
  });
});
