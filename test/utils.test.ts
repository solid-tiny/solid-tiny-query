import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInterval, createWatch, isDef } from '../src/utils';

describe('Utils', () => {
  describe('isDef', () => {
    it('should return true for defined values', () => {
      expect(isDef(0)).toBe(true);
      expect(isDef('')).toBe(true);
      expect(isDef(false)).toBe(true);
      expect(isDef([])).toBe(true);
      expect(isDef({})).toBe(true);
      expect(isDef('hello')).toBe(true);
      expect(isDef(42)).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isDef(null)).toBe(false);
      expect(isDef(undefined)).toBe(false);
    });
  });

  describe('createWatch', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should call function when signal changes', () => {
      const [count, setCount] = createSignal(0);
      const watchFn = vi.fn();

      createWatch(count, watchFn, {
        defer: true,
      });

      // Initial call should not happen by default
      expect(watchFn).not.toHaveBeenCalled();

      setCount(1);
      vi.runAllTimers();

      expect(watchFn).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it('should handle array of signals', () => {
      const [count, setCount] = createSignal(0);
      const [name, setName] = createSignal('test');
      const watchFn = vi.fn();

      createWatch(() => [count(), name()], watchFn);

      setCount(1);
      setName('updated');
      vi.runAllTimers();

      expect(watchFn).toHaveBeenCalledWith(
        [1, 'updated'],
        undefined,
        undefined
      );
    });
  });

  describe('createInterval', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create an interval with dynamic timing', () => {
      const fn = vi.fn();
      const [delay] = createSignal(1000);

      createInterval(fn, delay);

      // Fast forward time
      vi.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should update interval when delay changes', () => {
      const fn = vi.fn();
      const [delay, setDelay] = createSignal(1000);

      createInterval(fn, delay);

      // Change delay
      setDelay(500);
      vi.runAllTimers();

      // Advance by new delay
      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not create interval when delay is 0', () => {
      const fn = vi.fn();
      const [delay] = createSignal(0);

      createInterval(fn, delay);

      vi.advanceTimersByTime(5000);
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
