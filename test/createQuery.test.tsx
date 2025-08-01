import { createRoot, type JSX } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../src/client';
import { createQuery } from '../src/hooks/createQuery';

describe('createQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const Wrapper = (props: { children: JSX.Element }) => {
    const client = createQueryClient();
    return <client.Provider>{props.children}</client.Provider>;
  };

  function runWithWrapper(fn: () => void) {
    return createRoot(() => {
      const Run = () => {
        fn();

        return '';
      };

      return (
        <Wrapper>
          <Run />
        </Wrapper>
      );
    });
  }

  describe('Basic Functionality', () => {
    it('should create a query with initial value', () => {
      runWithWrapper(() => {
        const query = createQuery({
          queryKey: () => 'test',
          queryFn: async () => 'fetched-data',
          initialValue: 'initial-data',
        });
        expect(query.data).toBe('initial-data');
      });
    });

    it('should create a query without initial value', () => {
      runWithWrapper(() => {
        const query = createQuery({
          queryKey: () => 'test',
          queryFn: async () => 1,
        });
        expect(query.data).toBeUndefined;
      });
    });
  });
});
