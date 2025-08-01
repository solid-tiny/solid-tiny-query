# Solid Tiny Query

A lightweight, type-safe query library for SolidJS applications. Inspired by React Query but designed specifically for SolidJS with a minimal footprint.

## Features

- 🚀 **Lightweight**: Minimal bundle size
- 🔄 **Reactive**: Built on SolidJS reactivity system
- 📦 **Type-safe**: Full TypeScript support
- ⚡ **Fast**: Optimized performance with automatic caching
- 🛠️ **Flexible**: Configurable cache and garbage collection
- 🎯 **Simple**: Easy to use API

## Installation

```bash
pnpm add solid-tiny-query
```

## Quick Start

### 1. Set up the Query Client

```tsx
import { createQueryClient } from 'solid-tiny-query';

// Create a query client
const queryClient = createQueryClient({
  defaultStaleTime: 5000, // 5 seconds
  defaultGcTime: 300000,  // 5 minutes
});

// Wrap your app with the query client context
function App() {
  return (
    <queryClient.Provider>
      <MyComponent />
    </queryClient.Provider>
  );
}
```

### 2. Use Queries

```tsx
import { createQuery } from 'solid-tiny-query';

function UserProfile() {
  const userQuery = createQuery({
    queryKey: () => ['user', userId()],
    queryFn: async ({ value }) => {
      const response = await fetch(`/api/users/${userId()}`);
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    retry: 3,
  });

  return (
    <div>
      <Show when={userQuery.isLoading}>
        <div>Loading...</div>
      </Show>
      
      <Show when={userQuery.isError}>
        <div>Error loading user data</div>
      </Show>
      
      <Show when={userQuery.data}>
        <div>
          <h1>{userQuery.data.name}</h1>
          <p>{userQuery.data.email}</p>
        </div>
      </Show>
      
      <button onClick={() => userQuery.refetch()}>
        Refresh
      </button>
    </div>
  );
}
```

## API Reference

### `createQueryClient(options?)`

Creates a new query client context.

**Options:**
- `defaultStaleTime?: number` - Default time in ms after which data is considered stale (default: 0)
- `defaultGcTime?: number` - Default time in ms after which unused cache entries are garbage collected (default: 8 minutes)

### `createQuery(options)`

Creates a reactive query.

**Options:**
- `queryKey: () => QueryKey | QueryKeys | (QueryKey | QueryKeys)[]` - Unique key for the query
- `queryFn: QueryFn<T, R>` - Function that returns a promise or data
- `staleTime?: number` - Time in ms after which data is considered stale
- `initialValue?: T` - Initial value for the query
- `enabled?: () => boolean` - Whether the query should run
- `retry?: number` - Number of retry attempts (default: 2)
- `gcTime?: number` - Time in ms for garbage collection (default: based on staleTime)

**Returns:**
- `data: T | undefined` - The query data
- `isLoading: boolean` - Loading state
- `isError: boolean` - Error state
- `refetch: () => Promise<void>` - Function to refetch data
- `clearCache: () => void` - Function to clear query cache

### `useQueryClient()`

Hook to access the query client from context.

## Examples

### Basic Usage

```tsx
const todosQuery = createQuery({
  queryKey: () => ['todos'],
  queryFn: async () => {
    const response = await fetch('/api/todos');
    return response.json();
  },
});
```

### Dependent Queries

```tsx
const userQuery = createQuery({
  queryKey: () => ['user', userId()],
  queryFn: () => fetchUser(userId()),
});

const postsQuery = createQuery({
  queryKey: () => ['posts', userId()],
  queryFn: () => fetchUserPosts(userId()),
  enabled: () => !!userQuery.data, // Only run when user data is available
});
```

### With Initial Data

```tsx
const productQuery = createQuery({
  queryKey: () => ['product', productId()],
  queryFn: () => fetchProduct(productId()),
  initialValue: cachedProduct,
});
```

## Best Practices

1. **Use descriptive query keys**: Make them unique and descriptive
2. **Handle loading and error states**: Always provide feedback to users
3. **Set appropriate stale times**: Balance freshness with performance
4. **Use enabled queries**: For dependent or conditional queries
5. **Clean up when needed**: Use `clearCache()` for sensitive data

## License

ISC
