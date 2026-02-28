# Demo mode

## The problem

Itsyconnect requires App Store Connect credentials to function. This creates two issues:

1. **App Store review** – Apple reviewers won't have ASC credentials, and sharing ours isn't practical. Without a way to use the app credential-free, it will be rejected.
2. **First-run experience** – new users should be able to explore the app before committing to credential setup.

## Current state

Mock data files in `src/lib/`:

| File | Covers | Status |
|---|---|---|
| `mock-data.ts` | Apps, versions, builds, localizations | Restored – not wired to any pages (pages use real ASC API) |
| `mock-analytics.ts` | Downloads, sessions, engagement, referrers, crashes | Active – analytics pages import directly |
| `mock-testflight.ts` | Builds, groups, testers, feedback, review detail | Active – TestFlight pages import directly |

All mock files share consistent app IDs:
- `app-001` – Weatherly (weather app, iOS + macOS)
- `app-002` – Taskflow (task manager, iOS + macOS + tvOS)
- `app-003` – Photon Camera (camera app, iOS + visionOS)

## Planned implementation

### Entry point

The setup screen (`/setup`) gets a secondary action: "Explore with sample data". This bypasses credential entry and enters demo mode.

### Flag storage

A `demo` boolean column on the existing settings/config table in SQLite. Set to `true` when the user chooses demo mode, `false` when real credentials are saved.

### API-level switch

All `/api/*` routes check the demo flag:

```
if (isDemoMode()) {
  return NextResponse.json(mockAppsResponse());
}
// ... real ASC fetch
```

This keeps conditional logic out of client components entirely. The hooks, contexts, and pages are identical in both modes – they just fetch from `/api/*` and render whatever comes back.

### What each route returns in demo mode

- `/api/apps` – `MOCK_APPS` shaped as ASC API response
- `/api/apps/[appId]/versions` – `MOCK_VERSIONS` filtered by app
- `/api/apps/[appId]/versions/[versionId]/localizations` – `MOCK_LOCALIZATIONS` filtered by version
- `/api/apps/[appId]/versions/[versionId]/builds` – `MOCK_BUILDS` filtered by version
- Analytics, TestFlight routes – already use mock data, just need to keep doing so

### UI indicator

A subtle banner or badge when in demo mode: "Viewing sample data – [connect your credentials](/setup) to see real data". This makes it obvious the data isn't real and provides a path to exit demo mode.

### Exiting demo mode

User goes to `/setup` (or settings) and enters real ASC credentials. This clears the demo flag and the app switches to real data on the next page load.

## Implementation order

This doesn't need to be built all at once. The minimal steps for App Store submission:

1. Add the demo flag to the database
2. Add the "Explore with sample data" button to `/setup`
3. Wire `/api/apps` and `/api/apps/[appId]/versions` to return mock data in demo mode (these are the routes the core pages use)
4. Add the demo mode banner
5. Sales/analytics/TestFlight already show mock data, so no changes needed there

Later, as analytics/TestFlight get wired to real ASC data, their API routes should also check the demo flag and return mock data when active.

## Rules

- **Never delete `src/lib/mock-*.ts` files** – they power demo mode.
- When wiring a section to real data, keep the mock data file intact.
- All mock files should use the same app IDs and maintain cross-referential consistency.
- Tests exist for all mock data files in `tests/unit/mock-*.test.ts`.
