# Itsyship – development plan

> Open-source, self-hosted App Store Connect dashboard. Beautiful UI, AI-powered features, runs anywhere with Docker.

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 15** (App Router, standalone output) | SSR, API routes, tiny Docker image (~180 MB) |
| Database | **SQLite** via `better-sqlite3` | Single container, zero config, file-based backup |
| ORM | **Drizzle** | 7 KB, SQL-native, first-class SQLite support |
| UI | **shadcn/ui** + Tailwind v4 | Full source ownership, accessible, beautiful |
| ASC API | **appstore-connect-sdk** | TypeScript, auto-generated from Apple's OpenAPI spec |
| AI | **Vercel AI SDK** + Anthropic | Streaming, structured output (user provides own API key) |
| Auth | **iron-session** + bcrypt | Env var credentials, encrypted cookie, zero dependencies |
| Validation | **Zod** | Runtime + compile-time type safety |
| Testing | **Vitest** + **Playwright** | Fast unit tests, E2E, 100% coverage target |
| Deployment | **Docker** (single container) | `docker run` and you're done |

## Architecture

```
┌─────────────────────────────────────┐
│           Docker container          │
│                                     │
│  ┌───────────────────────────────┐  │
│  │     Next.js standalone        │  │
│  │                               │  │
│  │  /app          → pages/UI     │  │
│  │  /app/api      → API routes   │  │
│  │  /lib/asc      → ASC client   │  │
│  │  /lib/ai       → AI services  │  │
│  │  /db           → Drizzle+SQLite│  │
│  └───────────────────────────────┘  │
│                                     │
│  /data/itsyship.db  (volume mount) │
└─────────────────────────────────────┘
```

- Single process, single container, single SQLite file
- ASC credentials encrypted at rest (AES-256-GCM envelope encryption)
- Auth via env var (username + bcrypt password hash), session in encrypted cookie
- AI features are optional – only active if user provides an Anthropic API key
- No external services required (no Redis, no Postgres, no message queue)

---

## Phase 0 – Project bootstrap

**Goal:** Working Next.js app with auth, database, Docker, encryption, and a dashboard shell.

### Tasks

- [ ] Initialize Next.js 15 with TypeScript, Tailwind v4, ESLint
- [ ] Set up shadcn/ui with core components
- [ ] Configure SQLite + Drizzle ORM with WAL mode
- [ ] Define database schema: `asc_credentials`, `asc_apps` (cache), `settings`
- [ ] Implement envelope encryption module (AES-256-GCM) for ASC private keys
- [ ] Implement auth: env var credentials, iron-session, login page, middleware
- [ ] Build app shell: login page, dashboard layout with sidebar navigation
- [ ] Create Dockerfile (multi-stage, standalone output, ~180 MB)
- [ ] Create docker-compose.yml with volume mount for /data
- [ ] Set up Vitest with coverage reporting, Playwright for E2E
- [ ] Write tests for encryption module and auth flow
- [ ] Create .env.example and README with setup instructions

### Deliverable
`docker compose up` gives you a running app with login screen and empty dashboard.

---

## Phase 1 – ASC connection and apps

**Goal:** Connect App Store Connect account, see all apps.

### Tasks

- [ ] Build settings page for ASC credential management:
  - Upload issuer ID, key ID, .p8 private key
  - Validate credentials with a test API call
  - Store encrypted, show connection status
  - Support replacing credentials
- [ ] Build ASC API service layer:
  - JWT token generation from encrypted credentials (decrypt on demand, 15 min max)
  - Rate limit–aware request wrapper (token bucket: 5/sec, backoff on 429)
  - Response caching with configurable TTL
- [ ] Build apps list page (`/apps`):
  - Fetch all apps from ASC, cache in SQLite
  - Data table: app name, bundle ID, platform, status, icon
  - Search and filter
  - Pull-to-refresh / manual sync
- [ ] Write tests for ASC service, credential encryption round-trip, apps list

### Deliverable
Connect your ASC account, see all your apps in a beautiful table.

---

## Phase 2 – App metadata and localizations

**Goal:** View and edit all app metadata, manage localizations, submit for review.

### Tasks

- [ ] Build app detail page (`/apps/[appId]`):
  - App header: name, icon, bundle ID, platform, categories
  - Tabbed interface: Versions, App info, Pricing
- [ ] Build version management:
  - List all App Store versions with state badges
  - Version detail with all localizations
- [ ] Build localization editor:
  - Locale selector sidebar
  - Metadata form: name, subtitle, description, keywords, what's new, promotional text, URLs
  - Character counts with App Store limits
  - Diff view: current vs edited
  - Save draft locally, push to ASC on confirm
- [ ] Build screenshot manager:
  - Upload per locale per display type
  - Drag-and-drop reorder
  - Device frame preview
  - Bulk upload
  - App preview video support
- [ ] Build submission flow:
  - Attach build to version
  - Review all changes across locales
  - Submit for App Review
  - Poll/display review status
- [ ] Write tests for metadata editing, screenshot upload, submission

### Deliverable
Full metadata editing – localizations, screenshots, and App Review submission.

---

## Phase 3 – AI features

**Goal:** AI-powered translations, copywriting, and metadata optimization.

### Tasks

- [ ] Settings page: Anthropic API key input (encrypted, stored in DB)
- [ ] Build AI translation service:
  - Translate metadata to multiple locales at once
  - Structured output with Zod schemas
  - Side-by-side review: source vs AI vs existing
  - Edit before applying
  - Batch mode: one field across all locales, or all fields for one locale
- [ ] Build AI copywriting assistant:
  - Generate/improve descriptions, what's new, keywords
  - Streaming responses in the UI
  - Context-aware (existing metadata, category, audience)
  - Tone selector: professional, casual, playful, technical
- [ ] Build AI metadata analyzer:
  - Quality score per locale
  - Keyword optimization suggestions
  - Description structure recommendations
- [ ] Token usage display (show cost per operation)
- [ ] Write tests for AI services (mocked API responses)

### Deliverable
AI translation, copywriting, and optimization integrated into the editing workflow.

---

## Phase 4 – TestFlight

**Goal:** Manage beta testing – groups, testers, builds, feedback.

### Tasks

- [ ] Build TestFlight dashboard (`/apps/[appId]/testflight`):
  - Overview: active builds, tester count, invitations
- [ ] Beta group management: create/edit/delete, add/remove testers, bulk import CSV
- [ ] Tester management: list, invite, search, filter, status tracking
- [ ] Build management: list with processing status, assign to groups, submit for beta review
- [ ] Beta localization editor: "what to test" per build per locale
- [ ] Feedback viewer: TestFlight feedback with screenshots, filter by build/device
- [ ] AI-assisted "what to test" generation from release notes
- [ ] Write tests for TestFlight flows

### Deliverable
Complete TestFlight management from one dashboard.

---

## Phase 5 – In-app purchases and subscriptions

**Goal:** Full IAP and subscription management.

### Tasks

- [ ] IAP management: list, create, edit, delete, localizations, pricing, review screenshots, submit
- [ ] Subscription management: groups, individual subscriptions, localizations, pricing
- [ ] Pricing tools: visual price matrix (territories x tiers), bulk updates, scheduling
- [ ] Offer management: introductory, promotional, offer codes
- [ ] AI-assisted IAP/subscription copywriting and translation
- [ ] Write tests for IAP and subscription CRUD

### Deliverable
Manage all monetization from one place.

---

## Phase 6 – Analytics and reporting

**Goal:** Sales, downloads, financials, and performance metrics.

### Tasks

- [ ] Analytics dashboard (`/analytics`):
  - Overview cards: downloads, revenue, crashes, ratings
  - Date range picker (7d, 30d, 90d, 1y, custom)
  - App selector
- [ ] Sales and trends: downloads, revenue, geographic/source/device breakdowns
- [ ] Financial reports: earnings by product/territory/currency, export CSV
- [ ] Performance metrics: crash rate, launch time, memory, hang rate, trends
- [ ] Customer reviews: list across apps, respond, filter by rating/sentiment
- [ ] AI review response suggestions
- [ ] Scheduled data sync (configurable interval via cron or manual trigger)
- [ ] Write tests for data processing and chart rendering

### Deliverable
Comprehensive analytics dashboard with all ASC reporting data.

---

## Phase 7 – Provisioning and remaining features

**Goal:** Certificates, profiles, devices, and full ASC API coverage.

### Tasks

- [ ] Bundle IDs: list, register, manage capabilities
- [ ] Certificates: list, create, revoke, download
- [ ] Devices: register, list, manage
- [ ] Provisioning profiles: create, list, download, regenerate
- [ ] App Clips: experiences, metadata editing
- [ ] Game Center: achievements, leaderboards
- [ ] Sandbox testers management
- [ ] Write tests for all features

### Deliverable
Complete ASC API coverage in one beautiful UI.

---

## Phase 8 – Polish and release

**Goal:** Production-quality open-source release.

### Tasks

- [ ] Performance: aggressive caching, optimistic UI, virtual scrolling, image optimization
- [ ] Error handling: global error boundaries, friendly ASC error messages, rate limit visualization
- [ ] Dark mode support
- [ ] Keyboard shortcuts for power users
- [ ] README: features, screenshots, setup guide, Docker instructions, .p8 key creation walkthrough
- [ ] CONTRIBUTING.md, LICENSE (MIT)
- [ ] GitHub Actions: CI (lint, test, build), Docker image publish to GHCR
- [ ] Security audit: OWASP checklist, CSP headers, dependency scan
- [ ] 100% test coverage verified
- [ ] Tagged v1.0.0 release with Docker image

### Deliverable
`docker run ghcr.io/itsyship/itsyship` – your App Store Connect dashboard.

---

## Key decisions

### Auth
Env var credentials (`AUTH_USERNAME` + `AUTH_PASSWORD_HASH` as bcrypt). Session managed by `iron-session` (encrypted cookie, no DB needed for sessions). Login page at `/login`. Middleware protects all routes except `/login` and `/api/health`.

### ASC credential storage
AES-256-GCM envelope encryption. Master key from `ENCRYPTION_MASTER_KEY` env var (32 bytes hex). Unique DEK per credential. Decryption happens server-side only, on-demand for JWT token generation.

### AI is optional
If `ANTHROPIC_API_KEY` is not set, AI features are hidden from the UI. No degraded experience – just fewer features.

### SQLite with WAL mode
`PRAGMA journal_mode=WAL` for concurrent reads. `PRAGMA foreign_keys=ON`. Database file at `/data/itsyship.db` inside the container, persisted via Docker volume.

### Rate limiting for ASC API
Token bucket: 5 requests/second sustained. Automatic retry with exponential backoff on 429. Response cache with TTL per resource type (apps: 5 min, builds: 1 min, metadata: 5 min).
