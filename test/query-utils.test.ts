import { describe, expect, it, vi } from 'vitest';
import {
  delay,
  getDefaultGcTime,
  getRealQueryKey,
} from '../src/utils/query-utils';

describe('Query Utils', () => {
  describe('getRealQueryKey', () => {
    it('should convert string key to string', () => {
      expect(getRealQueryKey('test')).toBe('test');
    });

    it('should convert number key to string', () => {
      expect(getRealQueryKey(123)).toBe('123');
    });

    it('should convert array of keys to sorted joined string', () => {
      expect(getRealQueryKey(['user', 'profile'])).toBe('profile-user');
      expect(getRealQueryKey([1, 2, 3])).toBe('1-2-3');
      expect(getRealQueryKey(['z', 'a', 'b'])).toBe('a-b-z');
    });

    it('should handle nested arrays by flattening them', () => {
      expect(getRealQueryKey([['user', 'profile'], 'data'])).toBe(
        'data-profile-user'
      );
      expect(
        getRealQueryKey([
          [1, 2],
          [3, 4],
        ])
      ).toBe('1-2-3-4');
    });

    it('should handle mixed types in arrays', () => {
      expect(getRealQueryKey(['user', 123, 'profile'])).toBe(
        '123-profile-user'
      );
    });
  });

  describe('delay', () => {
    it('should resolve after specified milliseconds', async () => {
      vi.useFakeTimers();

      const promise = delay(1000);
      let resolved = false;

      promise.then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      vi.advanceTimersByTime(999);
      await Promise.resolve(); // Let promises resolve
      expect(resolved).toBe(false);

      vi.advanceTimersByTime(1);
      await Promise.resolve();
      expect(resolved).toBe(true);

      vi.useRealTimers();
    });

    it('should resolve immediately for 0 delay', async () => {
      const start = Date.now();
      await delay(0);
      const end = Date.now();

      // Should resolve very quickly (within a few milliseconds)
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('getDefaultGcTime', () => {
    it('should return 5000 when staleTime is undefined', () => {
      expect(getDefaultGcTime()).toBe(5000);
    });

    it('should return 5000 when staleTime is less than 5000', () => {
      expect(getDefaultGcTime(1000)).toBe(5000);
      expect(getDefaultGcTime(4999)).toBe(5000);
    });

    it('should return staleTime when it is 5000 or greater', () => {
      expect(getDefaultGcTime(5000)).toBe(5000);
      expect(getDefaultGcTime(10_000)).toBe(10_000);
      expect(getDefaultGcTime(50_000)).toBe(50_000);
    });

    it('should handle edge case of exactly 5000', () => {
      expect(getDefaultGcTime(5000)).toBe(5000);
    });
  });
});
