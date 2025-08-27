/**
 * Check if a value is defined (not null or undefined)
 */
export function isDef<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// biome-ignore lint/suspicious/noConfusingVoidType: need
export type Maybe<T> = T | undefined | null | void;
