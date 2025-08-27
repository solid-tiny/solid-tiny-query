import { createSignal } from 'solid-js';
import { sleep } from 'solid-tiny-utils';
import { createQuery } from '~';
import { Button } from '../../../components/button';

export default function BasicUsage() {
  const [count, setCount] = createSignal(0);
  const query = createQuery({
    queryKey: () => 'basic-usage',
    queryFn: async () => {
      await sleep(2000);
      setCount((c) => c + 1);
      return `count is ${count()}`;
    },
  });
  return (
    <div>
      <div>Data: {query.data}</div>
      <div>isLoading: {query.isLoading ? 'true' : 'false'}</div>
      <Button disabled={query.isLoading} onClick={() => query.refetch()}>
        Refetch
      </Button>
    </div>
  );
}
