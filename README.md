# Solid Tiny Query

![npm](https://img.shields.io/npm/v/solid-tiny-query) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/solid-tiny-query) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)


A lightweight, type-safe query library for SolidJS applications. Inspired by React Query but designed specifically for SolidJS with a minimal footprint.

## Features

- 🚀 **Lightweight**: Minimal bundle size with zero configuration
- 🔄 **Reactive**: Built on SolidJS reactivity system with automatic cache updates
- 📦 **Type-safe**: Full TypeScript support with intelligent type inference
- ⚡ **Fast**: Optimized performance with debounced key changes and stale-while-revalidate caching
- 🛠️ **Flexible**: Configurable stale time, retry logic, and automatic garbage collection
- 🎯 **Simple**: Easy to use API with minimal boilerplate
- 🔀 **Smart Caching**: Automatic cache invalidation and background refetching
- 🎛️ **Conditional Queries**: Enable/disable queries based on reactive conditions

## Installation

```bash
pnpm add solid-tiny-query
```

## Quick Start

### 1. Set up the Query Client

```tsx
import { createQueryClient } from 'solid-tiny-query';

// Create a query client with optional configuration
const queryClient = createQueryClient({
  defaultStaleTime: 5000, // 5 seconds - time before data is considered stale
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
import { createSignal, Show } from 'solid-js';

function UserProfile() {
  const [userId, setUserId] = createSignal('1');
  
  const userQuery = createQuery({
    queryKey: () => ['user', userId()],
    queryFn: async ({ value, refetching }) => {
      // value: current cached data or undefined
      // refetching: boolean indicating if this is a refetch
      const response = await fetch(`/api/users/${userId()}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    staleTime: 30000, // Data is fresh for 30 seconds
    retry: 3, // Retry failed requests up to 3 times
    enabled: () => Boolean(userId()), // Only run when userId exists
  });

  return (
    <div>
      <Show when={userQuery.isLoading}>
        <div>Loading user data...</div>
      </Show>
      
      <Show when={userQuery.isError}>
        <div>Error loading user data. Please try again.</div>
      </Show>
      
      <Show when={userQuery.data}>
        <div>
          <h1>{userQuery.data.name}</h1>
          <p>{userQuery.data.email}</p>
        </div>
      </Show>
      
      <button onClick={() => userQuery.refetch()}>
        Refresh User Data
      </button>
      
      <button onClick={() => userQuery.clearCache()}>
        Clear Cache
      </button>
    </div>
  );
}
```

## API Reference

### `createQueryClient(options?)`

Creates a new query client context with automatic garbage collection.

**Options:**

- `defaultStaleTime?: number` - Default time in ms after which data is considered stale (default: 0)

**Returns:** A SolidJS context provider component

### `createQuery(options)`

Creates a reactive query with automatic caching and background updates.

**Options:**
- `queryKey: () => QueryKey | QueryKeys | (QueryKey | QueryKeys)[]` - Reactive function returning unique key(s) for the query
- `queryFn: (info: QueryFnInfo<T>) => T | Promise<T>` - Function that fetches and returns data
  - `info.value` - Current cached data or undefined
  - `info.refetching` - Boolean indicating if this is a background refetch
- `staleTime?: number` - Time in ms after which data is considered stale (default: 0)
- `initialData?: T` - Initial data that will be cached and prevent first fetch
- `initialDataUpdatedAt?: number` - Timestamp for initial data (default: Date.now())
- `placeholderData?: T` - Placeholder data shown during first fetch (not cached)
- `enabled?: () => boolean` - Reactive function to enable/disable the query
- `retry?: number` - Number of retry attempts on failure (default: 2)

**Returns:**
- `data: T | undefined` - The query data (T if initialData provided)
- `isLoading: boolean` - Loading state during active fetch
- `isError: boolean` - Error state if query failed
- `refetch: () => Promise<void>` - Function to manually refetch data
- `clearCache: () => void` - Function to clear all cached data for this query (and history queries if key is reactive)

### `useQueryClient()`

Hook to access the query client state and actions from context.

**Returns:** `[state, actions]` tuple with cache state and management methods

## Examples

### Basic Usage

```tsx
import { createQuery } from 'solid-tiny-query';

const todosQuery = createQuery({
  queryKey: () => ['todos'],
  queryFn: async () => {
    const response = await fetch('/api/todos');
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
  },
  staleTime: 60000, // Fresh for 1 minute
});
```

### With Initial Data

```tsx
import { createQuery } from 'solid-tiny-query';

const productQuery = createQuery({
  queryKey: () => ['product', productId()],
  queryFn: async () => {
    const response = await fetch(`/api/products/${productId()}`);
    return response.json();
  },
  initialData: cachedProduct, // Prevents initial fetch if provided
  initialDataUpdatedAt: Date.now() - 30000, // Data is 30 seconds old
});
```

### With Placeholder Data

```tsx
import { createQuery } from 'solid-tiny-query';

const userQuery = createQuery({
  queryKey: () => ['user', userId()],
  queryFn: async () => fetchUser(userId()),
  placeholderData: { name: 'Loading...', email: '' }, // Shown during first fetch
  staleTime: 300000, // Fresh for 5 minutes
});
```

### Dependent/Conditional Queries

```tsx
import { createQuery } from 'solid-tiny-query';
import { createSignal } from 'solid-js';

function UserPosts() {
  const [userId, setUserId] = createSignal<string | null>(null);
  
  const userQuery = createQuery({
    queryKey: () => ['user', userId()],
    queryFn: () => fetchUser(userId()!),
    enabled: () => Boolean(userId()), // Only runs when userId exists
  });

  const postsQuery = createQuery({
    queryKey: () => ['posts', userId()],
    queryFn: () => fetchUserPosts(userId()!),
    enabled: () => Boolean(userQuery.data), // Only runs when user data loaded
    staleTime: 120000, // Fresh for 2 minutes
  });

  return (
    <div>
      <input 
        type="text" 
        placeholder="Enter user ID"
        onInput={(e) => setUserId(e.target.value || null)}
      />
      <Show when={postsQuery.data}>
        <div>Posts: {postsQuery.data.length}</div>
      </Show>
    </div>
  );
}
```

### Dynamic Query Keys

```tsx
import { createQuery } from 'solid-tiny-query';
import { createSignal } from 'solid-js';

function SearchResults() {
  const [searchTerm, setSearchTerm] = createSignal('');
  const [filters, setFilters] = createSignal({ category: 'all' });
  
  const searchQuery = createQuery({
    queryKey: () => ['search', searchTerm(), filters()], // Reactive key
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchTerm(),
        category: filters().category,
      });
      const response = await fetch(`/api/search?${params}`);
      return response.json();
    },
    enabled: () => searchTerm().length > 2, // Only search with 3+ characters
    staleTime: 30000, // Fresh for 30 seconds
    retry: 1, // Only retry once for search
  });

  return (
    <div>
      <input 
        type="text"
        value={searchTerm()}
        onInput={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      <Show when={searchQuery.isLoading}>Searching...</Show>
      <Show when={searchQuery.data}>
        <div>Found {searchQuery.data.results.length} results</div>
      </Show>
    </div>
  );
}
```

## Best Practices

1. **Use descriptive and stable query keys**: Make them unique, hierarchical, and avoid frequent changes
   ```tsx
   // ✅ Good - stable, descriptive keys
   queryKey: () => ['users', userId(), 'posts', { status: 'published' }]
   
   // ❌ Bad - includes functions or unstable references
   queryKey: () => ['posts', someFunction, { createdAt: new Date() }]
   ```

2. **Handle loading and error states gracefully**: Always provide user feedback
   ```tsx
   // ✅ Good - comprehensive state handling
   <Show when={query.isLoading} fallback={
     <Show when={query.isError} fallback={
       <div>{query.data.content}</div>
     }>
       <ErrorMessage onRetry={() => query.refetch()} />
     </Show>
   }>
     <LoadingSpinner />
   </Show>
   ```

3. **Set appropriate stale times**: Balance data freshness with performance
   - User profiles: 300000ms (5 minutes)
   - Search results: 30000ms (30 seconds)  
   - Real-time data: 0ms (always fresh)

4. **Use conditional queries effectively**: Enable queries based on dependencies
   ```tsx
   enabled: () => Boolean(userId() && userPermissions().canViewPosts)
   ```

5. **Optimize query functions**: Include current data for optimistic updates
   ```tsx
   queryFn: async ({ value, refetching }) => {
     if (refetching && value) {
       // Show existing data while refetching
       showOptimisticUpdate(value);
     }
     return await fetchData();
   }
   ```

6. **Clean up when needed**: Use `clearCache()` for sensitive data or memory management
   ```tsx
   onCleanup(() => {
     sensitiveDataQuery.clearCache();
   });
   ```

7. **Leverage TypeScript**: Use proper typing for better DX and error prevention
   ```tsx
   interface User { id: string; name: string; }
   
   const userQuery = createQuery<User>({
     queryKey: () => ['user', userId()],
     queryFn: async (): Promise<User> => {
       // TypeScript will enforce return type
       return await fetchUser(userId());
     }
   });
   ```

## Key Features

### Automatic Cache Management
- **Stale-while-revalidate**: Serve cached data instantly while refetching in background
- **Intelligent garbage collection**: Automatically clean up unused cache entries
- **Debounced key changes**: Prevent excessive refetches when query keys change rapidly

### Type Safety
- **Full TypeScript support**: Get complete type inference and safety
- **Overloaded signatures**: Different return types based on `initialData` and `placeholderData`
- **Generic query functions**: Type-safe query functions with proper error handling

### Performance Optimizations
- **Request deduplication**: Multiple components using the same query share results
- **Background refetching**: Keep data fresh without blocking UI
- **Conditional execution**: Only run queries when enabled and dependencies are met

## FAQ

### Why initial fetch didn't fire immediately?

According to the debounced key change logic, the initial fetch didn't trigger until the first stable key was established. This prevents unnecessary requests when the query key is still being set up. The delay time is 100ms.


## Migration Notes

This library is designed as a lightweight alternative to React Query for SolidJS applications. Key differences:

- Uses SolidJS reactivity instead of React's re-rendering model
- Smaller bundle size with zero configuration required  
- Built-in automatic garbage collection
- Simplified API focused on common use cases
