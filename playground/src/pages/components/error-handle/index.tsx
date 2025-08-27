import { sleep } from 'solid-tiny-utils';
import { createQuery } from '~';
import { Button } from '../../../components/button';

export default function ErrorHandle() {
  const queryFn = async () => {
    await sleep(1500);
    // biome-ignore lint/suspicious/noConsole: need log
    console.log('fetched');

    throw new Error('An error occurred');
  };

  const query = createQuery({
    queryKey: () => 'error-handle',
    onError: () => {
      // biome-ignore lint/suspicious/noConsole: need log
      console.log('Error occurred');
    },
    queryFn,
  });

  return (
    <div>
      <div>
        <p>Error occurred: {query.isError ? 'true' : 'false'}</p>
        <p>IsLoading: {query.isLoading ? 'true' : 'false'}</p>
      </div>
      <Button disabled={query.isLoading} onClick={() => query.refetch()}>
        Refetch
      </Button>
    </div>
  );
}
