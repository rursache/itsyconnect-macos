<h1>Itsyship</h1>

<p>
  App Store Connect, but good.
</p>

<p>
  <a href="https://github.com/nickustinov/itsyship/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License" /></a>
  <a href="https://github.com/nickustinov/itsyship/actions"><img src="https://img.shields.io/github/actions/workflow/status/nickustinov/itsyship/ci.yml?branch=main" alt="CI" /></a>
  <img src="https://img.shields.io/badge/next.js-15-black" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/sqlite-WAL-green" alt="SQLite" />
</p>

---

Local-only App Store Connect dashboard with optional AI translation/copywriting – BYOK. One SQLite file, zero cloud dependencies.

## Features

- **App management** – view and edit app metadata, store listings, keywords, and localizations across multiple locales
- **Screenshots** – manage screenshot sets per locale and device
- **Version control** – track app versions across iOS, macOS, tvOS, and visionOS with status indicators
- **TestFlight** – manage builds, beta groups, testers, and feedback in one place
- **Analytics** – downloads, sessions, impressions, acquisition sources, and crash reports
- **Sales & finance** – revenue charts, territory breakdowns, transaction history
- **App review** – preview submissions and track review status
- **AI-powered** – optional AI translations and copywriting via Vercel AI SDK (bring your own API key)
- **Multi-platform** – iOS, macOS, tvOS, and visionOS from a single dashboard
- **Local-only** – runs on your machine, your data never leaves your computer

## Architecture

```
Single Next.js process
├── /app/api/*        → REST API routes
├── /lib/asc/*        → App Store Connect SDK wrapper
├── /lib/ai/*         → Vercel AI SDK integration
├── /db/*             → Drizzle ORM + SQLite (WAL mode)
├── /lib/sync/*       → Background data sync worker
└── /data/itsyship.db → SQLite database
```

**Stack:** Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · SQLite via better-sqlite3 · Drizzle ORM · AES-256-GCM envelope encryption

## Quick start

```bash
git clone https://github.com/nickustinov/itsyship.git
cd itsyship
npm install
npm run dev
```

Open `http://localhost:3000` – the setup wizard will guide you through connecting your App Store Connect credentials and optionally configuring AI.

On first run, `ENCRYPTION_MASTER_KEY` is auto-generated and written to `.env.local`.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `ENCRYPTION_MASTER_KEY` | Yes* | 64-char hex string for envelope encryption |
| `DATABASE_PATH` | No | SQLite path (default: `./data/itsyship.db`) |
| `PORT` | No | Server port (default: `3000`) |

*Auto-generated on first run if not set.

Generate manually:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security

- ASC private keys and AI API keys encrypted at rest with AES-256-GCM envelope encryption
- All inputs validated with Zod schemas
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, CSP

## Development

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run db:generate   # Generate Drizzle migration
npm run db:migrate    # Run migrations
npm run db:studio     # Drizzle Studio
npm run lint          # ESLint
```

## Testing

Tests use Vitest (unit/integration) and Playwright (E2E). The test database runs in-memory SQLite.

```bash
npm test
```

## License

[AGPL-3.0](LICENSE)
