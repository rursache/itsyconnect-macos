<h1>Itsyship</h1>

<p>
  App Store Connect, but good.
</p>

<p>
  <a href="https://github.com/nickustinov/itsyship/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <a href="https://github.com/nickustinov/itsyship/actions"><img src="https://img.shields.io/github/actions/workflow/status/nickustinov/itsyship/ci.yml?branch=main" alt="CI" /></a>
  <img src="https://img.shields.io/badge/electron-40-9feaf9" alt="Electron" />
  <img src="https://img.shields.io/badge/next.js-16-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/sqlite-WAL-green" alt="SQLite" />
</p>

---

Native macOS desktop app for App Store Connect with optional AI translation/copywriting – BYOK. One SQLite file, zero cloud dependencies. Master encryption key secured via macOS Keychain.

## Features

- **App management** – view and edit app metadata, store listings, keywords, and localizations across multiple locales
- **Screenshots** – manage screenshot sets per locale and device
- **Version control** – track app versions across iOS, macOS, tvOS, and visionOS with status indicators
- **TestFlight** – manage builds, beta groups, testers, and feedback in one place
- **Analytics** – downloads, sessions, impressions, acquisition sources, and crash reports
- **Sales & finance** – revenue charts, territory breakdowns, transaction history
- **App review** – preview submissions and track review status
- **AI-powered** – optional AI translations and copywriting (bring your own API key)
- **Multi-platform** – iOS, macOS, tvOS, and visionOS from a single dashboard
- **Local-only** – runs on your machine, your data never leaves your computer
- **Keychain-secured** – master encryption key stored in macOS Keychain via Electron safeStorage

## Architecture

```
Electron app
├── electron/main.ts      → main process (Keychain, server, window)
├── electron/preload.ts   → context bridge
├── /app/api/*            → REST API routes (Next.js)
├── /lib/asc/*            → App Store Connect SDK wrapper
├── /db/*                 → Drizzle ORM + SQLite (WAL mode)
└── ~/Library/Application Support/Itsyship/
    ├── itsyship.db       → SQLite database
    └── master-key.enc    → Keychain-encrypted master key
```

**Stack:** Electron · Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · SQLite via better-sqlite3 · Drizzle ORM · AES-256-GCM envelope encryption · macOS Keychain

## Quick start

```bash
git clone https://github.com/nickustinov/itsyship.git
cd itsyship
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

## Security

- Master encryption key stored in macOS Keychain via `electron.safeStorage`
- ASC private keys and AI API keys encrypted at rest with AES-256-GCM envelope encryption
- All inputs validated with Zod schemas
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, CSP

## License

[MIT](LICENSE)
