import { describe, expect, it } from 'vitest';
import { getRealQueryKey } from '../src/utils/query-utils';

describe('Query Utils', () => {
  describe('getRealQueryKey', () => {
    it('should convert string key to string', () => {
      expect(getRealQueryKey('test')).toBe('test');
    });

    it('should convert number key to string', () => {
      expect(getRealQueryKey(123)).toBe('123');
    });

    it('should convert array of keys to sorted joined string', () => {
      expect(getRealQueryKey(['user', 'profile'])).toBe('profileuser');
      expect(getRealQueryKey([1, 2, 3])).toBe('123');
      expect(getRealQueryKey(['z', 'a', 'b'])).toBe('abz');
    });

    it('should handle nested arrays by flattening them', () => {
      expect(getRealQueryKey([['user', 'profile'], 'data'])).toBe(
        'dataprofileuser'
      );
      expect(
        getRealQueryKey([
          [1, 2],
          [3, 4],
        ])
      ).toBe('1234');
    });

    it('should handle mixed types in arrays', () => {
      expect(getRealQueryKey(['user', 123, 'profile'])).toBe('123profileuser');
    });

    it('should handle null undefined correct', () => {
      expect(getRealQueryKey(['user', null, undefined, 0])).toBe(
        getRealQueryKey([undefined, 0, 'user', null])
      );

      expect(getRealQueryKey([null, undefined])).not.toEqual(
        getRealQueryKey([undefined, undefined])
      );
    });
  });
});
