## 2024-05-18 - [React.memo in Vercel AI SDK Chat UI]
**Learning:** Over-engineering `React.memo` with deep equality checks for messages when using the Vercel AI SDK (`@ai-sdk/react`) is unnecessary and counterproductive. The SDK uses immutable state updates, meaning a message object gets a new reference whenever it changes. Deep equality checks on arrays and objects on every render defeat the purpose of a fast memoization check.
**Action:** Use simple referential checks (`prevProps.message === nextProps.message`) when memoizing message components powered by immutable state management libraries.

## 2024-05-18 - [Vercel AI SDK React Server Components Hooks Overhead]
**Learning:** Calling unused hooks that rely on Context (like `useDataStream` calling `useContext(DataStreamContext)`) in child components forces those components to re-render whenever the context value changes, completely bypassing `React.memo()`. This caused O(N) re-renders for every single message chunk streamed.
**Action:** Never import and call Context-based hooks if their returned values are not actively used in the component. Double-check all `useX()` calls inside `React.memo()` boundaries to ensure they are strictly necessary.

## 2025-02-23 - [Parallel Fallbacks and API Latency]
**Learning:** Sequential queries over failover/fallback candidates inside loops dramatically increase overall latency when multiple candidates fail, causing user friction on stream generation. `fetch` inherently blocks in a `for...of` loop with `await`.
**Action:** Instead of sequentially attempting fallbacks, perform concurrent requests with `Promise.any` paired with an `AbortController`. When the first request resolves, signal the `AbortController` to abort all remaining slower requests to preserve network bandwidth and API credits.
## 2024-04-13 - N+1 Query in Export Route

**Learning:** Fetching related database entities inside loops (e.g., getting messages for each chat) causes an N+1 query problem, severely degrading performance as the number of items increases. Drizzle's `inArray` can be used to query bulk data.
**Action:** When querying related models for a list of items, extract the item IDs, perform a single batched query using `inArray`, group the results by the parent ID in memory, and then map them to their parent items.
## 2026-04-13 - Batched DB Queries for Subtasks
**Learning:** Avoid N+1 queries when fetching related entities (e.g. subtasks for a list of tasks). Using Promise.all with db queries inside a .map() loop creates unnecessary database round-trips and connection overhead.
**Action:** Use Drizzle ORM's inArray operator to fetch all related entities in a single batched query, then group them in-memory by their foreign key.
