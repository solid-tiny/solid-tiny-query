/* @refresh reload */
import { render } from 'solid-js/web';
import { enableGlobalStore } from 'solid-tiny-context';
import { App } from './app';

import 'uno.css';

const root = document.querySelector('#root');

render(() => <App />, root as HTMLElement);

enableGlobalStore();
