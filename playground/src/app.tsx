import routes from 'virtual:pages';
import { Router, useCurrentMatches } from '@solidjs/router';
import type { JSX } from 'solid-js';
import { createMemo, Suspense } from 'solid-js';
import { createQueryClient } from '../../src';
import { Aside } from './parts/aside';
import { Header } from './parts/header';

function RouteWrapper(props: { children: JSX.Element }) {
  const matches = useCurrentMatches();
  const info = createMemo(() => {
    const m = matches();
    if (m.length === 0) {
      return {};
    }
    return m.at(-1)?.route.info || {};
  });
  return (
    <div class="p-2">
      <div class="fw-bold text-2xl">{info().title}</div>
      <div class="p-2">{props.children}</div>
    </div>
  );
}

export function App() {
  const queryClient = createQueryClient();
  return (
    <queryClient.Provider>
      <Router
        root={(props) => (
          <div class="flex h-screen w-screen flex-col overflow-hidden bg-white">
            <div class="h-45px w-full bg-gray-100">
              <Header />
            </div>
            <div class="flex h-[calc(100%-45px)] w-full">
              <div class="h-full w-185px overflow-auto bg-gray-100">
                <Aside />
              </div>
              <Suspense>
                <div class="b-rd-tl-2xl b b-gray-200 h-full w-[calc(100%-185px)] overflow-auto">
                  <RouteWrapper>{props.children}</RouteWrapper>
                </div>
              </Suspense>
            </div>
          </div>
        )}
      >
        {routes}
      </Router>
    </queryClient.Provider>
  );
}
