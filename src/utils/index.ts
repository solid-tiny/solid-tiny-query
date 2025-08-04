import {
  type Accessor,
  type AccessorArray,
  createEffect,
  type OnEffectFunction,
  on,
  onCleanup,
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
 * Simple debounce function that delays execution until after wait milliseconds
 * have passed since the last time it was invoked.
 */
export function debounce<T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
): (...args: T) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  onCleanup(() => {
    clearTimeout(timeoutId);
  });

  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}
