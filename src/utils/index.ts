import {
  type Accessor,
  type AccessorArray,
  createEffect,
  type OnEffectFunction,
  on,
} from 'solid-js';

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDef<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function createWatch<S, Next extends Prev, Prev = Next>(
  targets: AccessorArray<S> | Accessor<S>,
  fn: OnEffectFunction<S, undefined | NoInfer<Prev>, Next>,
  opt?: {
    defer?: boolean;
  }
) {
  // biome-ignore lint/suspicious/noExplicitAny: I need any
  createEffect(on(targets, fn, { defer: opt?.defer }) as any);
}

/**
 * Create an interval that can have dynamic timing
 */
export function createInterval(fn: () => void, delay: Accessor<number>): void {
  let intervalId: number;

  const setupInterval = () => {
    clearInterval(intervalId);
    const currentDelay = delay();
    if (currentDelay > 0) {
      intervalId = setInterval(fn, currentDelay) as unknown as number;
    }
  };

  createWatch(delay, setupInterval);
  setupInterval();
}
