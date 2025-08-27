import { defineGlobalStore } from 'solid-tiny-context';

const appState = defineGlobalStore('app-state', {
  state: () => ({
    isDark: false,
    hue: 165,
  }),
  persist: 'localStorage',
});

export function useAppState() {
  return appState;
}
