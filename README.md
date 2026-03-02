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

- **AI-powered metadata** – translate descriptions, keywords, what's new, names, and subtitles across all locales with one click. Bring your own API key from Anthropic, OpenAI, Google, xAI, Mistral, or DeepSeek.
- **Bulk operations** – translate or copy all fields to one locale or every locale at once.
- **Self-hosted and private** – no data leaves your machine except direct calls to Apple's API and your chosen AI provider. AES-256-GCM envelope encryption, master key in the macOS Keychain. No accounts, no cloud, no telemetry.
- **Unified TestFlight** – builds, groups, testers, feedback, and beta app info in one interface with bulk actions.
- **Customer reviews** – translate foreign reviews, draft replies, generate appeal text with AI.
- **Screenshot management** – drag-and-drop reorder across all device categories and locales.
- **Analytics** – downloads, proceeds, crashes, acquisition, usage – all in one place.

## Quick start

```bash
git clone https://github.com/nickustinov/itsyconnect-macos.git
cd itsyconnect-macos
npm install
npm run electron:dev
```

The setup wizard will guide you through connecting your App Store Connect credentials.

## Development

```bash
npm run electron:dev          # Launch Electron with hot reload
npm run electron:make:dmg     # Build signed DMG
npm run electron:publish      # Publish to GitHub Releases (draft)
npm run test                  # Run tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
npm run db:generate           # Generate Drizzle migration
npm run db:studio             # Drizzle Studio
npm run lint                  # ESLint
```

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

## Releasing a new version

The app auto-updates via [update.electronjs.org](https://update.electronjs.org), which reads from public GitHub Releases.

1. Bump `APP_VERSION` and `BUILD_NUMBER` in `src/lib/version.ts`, and `"version"` in `package.json`
2. Commit and push
3. Publish to GitHub Releases (creates a draft with DMG + ZIP):
   ```bash
   GITHUB_TOKEN=ghp_xxx npm run electron:publish
   ```
4. Review the draft release on GitHub, edit release notes, then click **Publish**
5. `update.electronjs.org` picks up the new release – existing users are prompted to restart and update

Users can also check manually via **Itsyconnect > Check for updates…** in the menu bar.

## License

[AGPL-3.0](LICENSE)
