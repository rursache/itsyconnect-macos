# Background fetch

How analytics and app data are pre-fetched in the background so pages load instantly.

## When it triggers

| Event | What happens |
| --- | --- |
| App startup (`src/instrumentation.ts`) | `startSyncWorker()` is called. If credentials exist, sync runs immediately. |
| Setup complete (`POST /api/setup`) | `startSyncWorker()` is called after storing credentials. |
| Credential change (`POST /api/settings/credentials`) | `startSyncWorker()` is called after storing new credentials. |

## Sync worker design

**File:** `src/lib/sync/worker.ts`

- **Idempotent start** – `startSyncWorker()` checks `hasCredentials()` first; without credentials it logs "dormant" and returns without setting the `running` flag, so it can be called again later when credentials are added.
- **Immediate + interval** – on first start, all jobs run immediately, then repeat on 1-hour intervals (`setInterval` with `.unref()` so it doesn't prevent process exit).
- **Deduplication** – an in-flight `Map<string, Promise>` ensures concurrent callers join the same job instead of duplicating API calls.
- **Jobs** – currently two: `syncApps` (refreshes app list) and `syncAnalytics` (calls `buildAnalyticsData` for each app).

## Caching tiers

### Report ID caches (7-day TTL)

Report request IDs and report IDs are stable identifiers that rarely change.

1. **In-memory `Map`** – fastest, lost on restart.
2. **SQLite** (`cacheGet('asc-report-requests:{appId}')`, `cacheGet('asc-report-id:{requestId}:{reportName}')`) – survives restart, 7-day TTL.
3. **API call** – only if both tiers miss.

### Per-instance data (30-day TTL)

Each report instance (one day of data) is cached individually in SQLite under `analytics-inst:{instanceId}`. Past days are immutable; today's data uses a 10-minute TTL.

### Aggregated analytics (24-hour TTL)

The fully aggregated `AnalyticsData` object is cached under `analytics:{appId}` with a 24-hour TTL. The background sync worker refreshes it hourly, so the 24-hour TTL is a safety net.

## How pages interact

1. Client loads page and `AnalyticsProvider` fetches `/api/apps/{appId}/analytics`.
2. API route calls `buildAnalyticsData(appId)`.
3. If cached data exists (within 24h TTL) – returns instantly.
4. If sync is still running – `buildAnalyticsData` proceeds to fetch (the per-instance cache ensures only missing instances are downloaded). The sync worker's in-flight dedup prevents duplicate work.
5. Client shows a spinner until data arrives.

After the first successful sync, subsequent page loads are instant (served from the 24h aggregated cache).

## How to add new background-fetched data sources

1. Create or extend a sync job in `src/lib/sync/jobs.ts`.
2. Add the job to the `schedules` array in `src/lib/sync/worker.ts`.
3. Use `cacheSet()` with an appropriate TTL to store results.
4. In the API route, call `cacheGet()` first – if fresh data exists, return it without re-fetching.
