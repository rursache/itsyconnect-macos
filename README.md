<h1>Itsyconnect</h1>

<p>
  Better App Store Connect.
</p>

<p>
  <a href="https://github.com/nickustinov/itsyconnect-macos/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--v3-blue.svg" alt="License" /></a>
  <a href="https://github.com/nickustinov/itsyconnect-macos/actions"><img src="https://img.shields.io/github/actions/workflow/status/nickustinov/itsyconnect-macos/ci.yml?branch=main" alt="CI" /></a>
  <img src="https://img.shields.io/badge/electron-40-9feaf9" alt="Electron" />
  <img src="https://img.shields.io/badge/next.js-16-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/sqlite-WAL-green" alt="SQLite" />
</p>

---

A macOS desktop app that replaces Apple's App Store Connect web dashboard with a faster, AI-augmented interface. Runs entirely on your machine – one SQLite file, zero cloud dependencies, master encryption key secured via macOS Keychain.

## Why Itsyconnect over App Store Connect

Apple's web dashboard works, but it's slow, lacks AI tooling, and forces manual locale-by-locale editing. Itsyconnect fixes that:

**AI-powered metadata and reviews** – translate descriptions, keywords, what's new, names, and subtitles across all locales with one click. Draft review responses. Generate and optimise keywords. Translate foreign-language customer reviews. None of this exists in Apple's dashboard. Bring your own API key from Anthropic, OpenAI, Google, xAI, Mistral, or DeepSeek.

**Bulk operations across locales** – translate or copy all fields to a single locale, or to every locale simultaneously. Apple requires switching between locales one at a time and editing each manually.

**Self-hosted and private** – no data leaves your machine except direct calls to Apple's API (and optionally to your chosen AI provider). Credentials are encrypted with AES-256-GCM envelope encryption, master key lives in the macOS Keychain. No accounts, no cloud, no telemetry.

**Unified TestFlight management** – builds, groups, testers, feedback, and beta app info all in one navigable interface with bulk actions, rather than scattered across separate ASC pages.

**Feedback completion tracking** – mark TestFlight feedback items as done, toggle to hide completed items. Apple has no equivalent – you're left tracking this externally.

**Desktop app** – proper macOS application with integrated title bar, keyboard shortcuts, single-instance lock, and window state persistence. No browser tabs, no slow web dashboard.

**Screenshot drag-and-drop reorder** – reorder screenshots visually with drag-and-drop, across all device categories and locales.

**AI-assisted customer review management** – translate foreign reviews, auto-draft replies, translate your reply to the reviewer's language, generate appeal text for negative reviews.

## Features by page

### Setup wizard

Three-step onboarding flow:

- **Welcome screen** – introductory text and get started button
- **ASC credentials** – enter Issuer ID, upload your `.p8` private key file. Key ID is auto-extracted from the `AuthKey_XXXXXXXXXX.p8` filename. Connection is auto-tested against the ASC API immediately
- **AI configuration (optional)** – pick from 6 AI providers, select a model, enter an API key. Can be skipped and configured later in settings

### App overview

- App header with icon (fetched from latest build), name, and bundle ID
- Version status cards – up to 2 per platform (one live, one pending/in-review) with version string, state badge, and platform indicator
- Analytics KPI cards – downloads, proceeds, crash-free rate, each with sparkline charts
- Downloads bar chart and proceeds line chart for the selected date range

### Store listing

Full metadata editor for App Store version localizations:

- **Editable fields per locale** – description, keywords (comma-separated), what's new, promotional text, support URL, marketing URL
- **Version string editing** and build picker dropdown
- **Release settings** – manual / after approval / scheduled (with date picker), phased release toggle
- **Multi-locale support** – locale picker in the header, switch between locales instantly
- **Read-only mode** for live versions (only promotional text remains editable, matching Apple's rules)
- **Character counters** with validation limits on all text fields
- **AI features** – magic wand on individual fields, bulk translate to one locale, bulk translate to all locales

### Screenshots

Per-locale, per-device-category screenshot management:

- **Device category tabs** – iPhone, iPad, Mac, Apple TV, Apple Watch, Apple Vision
- **Upload** via click-to-select or file drop
- **Drag-and-drop reorder** with visual feedback
- **Delete, download** individual screenshots
- **Lightbox preview** with arrow-key navigation
- **Add/remove screenshot set variants** (e.g. add a 6.7" iPhone set)

### App details

- **Read-only identifiers** – bundle ID, SKU, app ID (each with copy button)
- **Editable per locale** – name, subtitle (each with AI wand)
- **Privacy URLs per locale** – privacy policy URL, privacy choices URL
- **Category pickers** – primary and secondary categories
- **Age rating** – read-only display
- **Content rights declaration** – yes / no / not applicable
- **App Store server notification URLs** – v1 and v2 endpoints
- **AI features** – magic wand on name/subtitle, bulk translate/copy across locales

### App review information

- Review notes for the review team with character counter
- Demo account – toggle for sign-in required, username and password fields
- Contact details – first name, last name, phone, email

### Customer reviews

- **Rating summary** – average rating, total count, star distribution bars (1–5)
- **Filters** – sort (newest/oldest/highest/lowest), rating level, territory, toggle to hide already-responded reviews
- **Paginated review list** – rating stars, title, body, reviewer nickname, date, territory (displayed as full country name)
- **Developer responses** – reply, edit, delete
- **AI features** – translate foreign-language reviews, draft a reply, translate your reply into the reviewer's language, generate appeal text

### TestFlight – builds

- Stats row – total builds, first build date, latest build date
- Builds table with checkbox selection – build number, version, processing status (coloured dots), groups (Internal/External badges), installs, sessions, crashes, uploaded date
- Bulk actions footer – add to group, remove from group, expire builds (with confirmation)
- Pagination for large build lists

### TestFlight – build detail

- Build header with icon, build number, version string, expiry countdown (days remaining)
- Stats row – created date, installs, sessions, crashes
- What's new editor with character counter
- Groups section – list assigned groups, add/remove groups
- Individual testers section – list testers with status, add existing tester or invite by email, remove tester

### TestFlight – feedback

- Summary card – total feedback count, screenshot count, crash count
- Filters – type (all/screenshots/crashes), date range (all/7/30/90 days), build number, platform, hide completed toggle (persisted)
- Feedback cards – type badge, comment preview, screenshot thumbnail, tester name/device info, build number
- Completion tracking – green checkmark on completed items, stored in SQLite

### TestFlight – groups

- Separate internal/external sections with badges
- Group cards showing tester count and build count
- Create group dialog – name, internal/external selection
- Delete group with confirmation

### TestFlight – group detail

- Group header – name, type badge, tester count, build count
- Public link toggle (external groups only) with copy-to-clipboard
- Builds table – checkbox selection, add build dropdown (grouped by version), bulk remove
- Testers table – checkbox selection, status dots (installed/accepted/not invited/revoked), bulk remove, add tester dialog with search

### TestFlight – beta app info

Beta app configuration with multi-locale support:

- Beta app information per locale – description (with AI wand), feedback email, marketing URL, privacy policy URL
- Beta app review information – contact details, review notes, demo account
- Licence agreement text
- AI features – magic wand on description, bulk translate/copy across all locales

### Analytics – overview

- 4 KPI cards – impressions, total downloads, proceeds, first-time downloads, each with period-over-period comparison
- Downloads and updates bar chart
- Proceeds and sales line chart
- Top territories horizontal bar chart
- Conversion funnel with conversion rates between stages
- Date range picker

### Analytics – usage

- Sessions and active devices (line chart)
- Average session duration (area chart)
- Sessions by app version (stacked area chart)
- Installations and deletions (bar chart)
- Analytics opt-in rate (bar chart)

### Analytics – acquisition

- Discovery sources (pie chart)
- Impressions and page views (line chart)
- Downloads by source (stacked bar chart)
- Web preview engagement (bar chart)

### Analytics – crashes

- 3 KPI cards – total crashes, affected devices, device models
- Crashes by version table
- Crashes by device table

### Settings

- **Credentials** – view current ASC credentials, test connection, replace `.p8` file, delete credentials (returns to setup wizard)
- **AI** – pick provider and model, configure or remove API key. Supported providers: Anthropic (Claude Sonnet/Haiku/Opus), OpenAI (GPT-5.2/5/5 Mini), Google (Gemini 3 Pro/Flash, 2.5 Pro/Flash), xAI (Grok 4.1/4/3), Mistral (Large/Medium/Small), DeepSeek (Chat/Reasoner)
- **Appearance** – system, light, or dark theme

## Architecture

```
Electron app
├── electron/main.ts      → main process (Keychain, server, window)
├── electron/preload.ts   → minimal context bridge (no FS access)
├── src/proxy.ts          → request interception (replaces middleware.ts)
├── src/app/api/*         → REST API routes (Next.js 16)
├── src/lib/asc/*         → App Store Connect API client
├── src/lib/ai/*          → AI prompt templates and streaming
├── src/db/*              → Drizzle ORM + SQLite (WAL mode)
└── ~/Library/Application Support/Itsyconnect/
    ├── itsyconnect.db    → SQLite database
    └── master-key.enc    → Keychain-encrypted master key
```

**Stack:** Electron 40 · Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Phosphor Icons · Geist font · SQLite via better-sqlite3 · Drizzle ORM · Recharts · dnd-kit · Zod · Vercel AI SDK · AES-256-GCM envelope encryption · macOS Keychain

### Security model

- **Master key** – 32-byte random key generated on first launch, encrypted via macOS Keychain (`safeStorage`), stored at `~/Library/Application Support/Itsyconnect/master-key.enc`
- **Envelope encryption** – each secret (ASC private key, AI API key) encrypted with its own DEK using AES-256-GCM. The DEK is then encrypted with the master key
- **No secrets in the browser** – API keys never leave the server process. Browser authenticates via session tokens
- **Input validation** – all API routes validate input with Zod schemas
- **Security headers** – HSTS, X-Content-Type-Options, X-Frame-Options, CSP

### Database

SQLite in WAL mode with 4 tables:

| Table | Purpose |
|---|---|
| `asc_credentials` | Encrypted ASC API credentials |
| `ai_settings` | Encrypted AI provider config |
| `cache_entries` | API response cache with per-resource TTLs |
| `feedback_completed` | TestFlight feedback completion tracking |

### Caching

Cache-first with background revalidation. TTLs: apps (1h), versions (15min), builds (5min), reviews (15min), analytics (1h), sales (1h).

## Quick start

```bash
git clone https://github.com/nickustinov/itsyconnect-macos.git
cd itsyconnect-macos
npm install
npm run electron:dev
```

The app will launch and the setup wizard will guide you through connecting your App Store Connect credentials.

## Development

```bash
npm run electron:dev          # Launch Electron with hot reload
npm run electron:make:dmg     # Build DMG for direct distribution
npm run electron:make:mas     # Build .pkg for Mac App Store
npm run test                  # Run tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
npm run db:generate           # Generate Drizzle migration
npm run db:studio             # Drizzle Studio
npm run lint                  # ESLint
```

## License

[AGPL-3.0](LICENSE)
