import { waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWatch, isDef } from '../src/utils';

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

      waitFor(() => {
        expect(watchFn).toHaveBeenCalledWith([1, 'updated']);
      });
    });
  });
});
