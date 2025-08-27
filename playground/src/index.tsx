/* @refresh reload */
import { render } from 'solid-js/web';
import { enableGlobalStore } from 'solid-tiny-context';
import { App } from './app';

import 'uno.css';
import { createQueryClient } from '~';

const root = document.querySelector('#root');

const queryClient = createQueryClient();

render(
  () => (
    <queryClient.Provider>
      <App />
    </queryClient.Provider>
  ),
  root as HTMLElement
);

enableGlobalStore();
