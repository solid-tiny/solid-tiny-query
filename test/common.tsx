import {
  createRoot,
  getOwner,
  type JSX,
  type Owner,
  runWithOwner,
} from 'solid-js';
import { createQueryClient, type QueryClientOptions } from '../src';

export function createWrapper(params?: QueryClientOptions) {
  const Wrapper = (props: { children: JSX.Element }) => {
    const client = createQueryClient(params);
    return <client.Provider>{props.children}</client.Provider>;
  };

  let dispose!: () => void;

  const owner = createRoot((d) => {
    dispose = d;
    let o: Owner | null = null;
    const GetOwn = () => {
      o = getOwner();

      return '';
    };

    const doE = () => (
      <Wrapper>
        <GetOwn />
      </Wrapper>
    );

    doE();

    return o as unknown as Owner;
  });
  return {
    run: <T, R>(fn: () => T extends Promise<R> ? never : T) => {
      return runWithOwner(owner, fn) as T;
    },
    dispose,
  };
}
