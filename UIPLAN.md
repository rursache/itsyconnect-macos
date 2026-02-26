# Itsyship – navigation and UX plan

## Core insight: two scopes + three workflows

ASC data splits into two scopes:

| Scope | What's in it | When it changes |
|---|---|---|
| **Version-scoped** | Metadata (name, subtitle, description, keywords, what's new, promo text), screenshots, previews, build selection, review notes, phased release | Every release |
| **App-scoped** | Categories, age rating, pricing, availability, privacy, IAPs, subscriptions | Occasionally, independent of versions |

Three distinct workflows:

1. **Ship a version** – edit metadata, upload screenshots, attach build, submit for review
2. **Manage the business** – pricing, IAPs, subscriptions, availability, privacy
3. **Monitor & respond** – reviews, analytics, TestFlight feedback

---

## Sidebar navigation

```
[App switcher ▾]

RELEASE
  Overview
  Store listing
  Screenshots
  App review

TESTING
  TestFlight

INSIGHTS
  Reviews
  Analytics

CONFIGURE
  App details
  Pricing
  In-app purchases
  Privacy

─────────
⚙ Settings
```

### Version/platform selector

A persistent **version bar** at the top of version-scoped pages (Store listing, Screenshots, App review):

```
┌──────────────────────────────────────────────────────────────┐
│  macOS ▾    2.1.0 – Waiting for review  ▾   [+ New version] │
└──────────────────────────────────────────────────────────────┘
```

Not shown on app-scoped pages (Reviews, Analytics, App details, Pricing, etc.).

---

## Page definitions

### Overview (version-scoped)
Status dashboard – what needs your attention:
- Current version status (badge: preparing, in review, waiting, live)
- Latest build (processing state, build number)
- Unanswered reviews count
- TestFlight: active builds, expiring soon
- Recent submission history
- Quick actions: "Submit for review", "Create new version"

### Store listing (version-scoped)
One page, tabbed by locale, containing everything on the store page:
- Name, subtitle (with char counts)
- Keywords (tag chips, AI generate button)
- Description (with AI improve/translate)
- What's new
- Promotional text
- Support URL, marketing URL

### Screenshots (version-scoped)
Per device type, per locale:
- Upload, drag-and-drop reorder
- Device frame preview
- Bulk upload
- App preview video support

### App review (version-scoped)
- Review notes (demo account, notes to reviewer, attachments)
- Contact details
- Submission history table
- Current submission status with timeline

### TestFlight (app-scoped)
Tabs within the page: Builds, Groups, Testers, Feedback
- Build list with processing status, group assignment
- Beta group management (create/edit/delete, public links)
- Tester management (invite, bulk CSV import)
- Beta feedback viewer

### Reviews (app-scoped)
- Customer reviews list with filters (rating, territory, date, responded/unresponded)
- Reply inline
- AI "suggest reply" button per review
- Summary sidebar: average rating, rating distribution, pros/cons

### Analytics (app-scoped)
- Overview cards: downloads, revenue, crashes, ratings
- Date range picker
- Sales and trends charts
- Geographic and source breakdowns

### App details (app-scoped)
Stable config that rarely changes:
- Categories (primary + secondary)
- Age rating
- Copyright
- Content rights
- Bundle ID, SKU, Apple ID (read-only)
- Primary language
- License agreement
- Encryption declarations

### Pricing (app-scoped)
- Base price and territory availability
- Price schedule / price changes
- Pre-orders

### In-app purchases (app-scoped)
Tabs: Consumables, Non-consumables, Subscriptions
- Full CRUD per item
- Localizations per item
- Pricing matrix (territories x tiers)
- Offer management

### Privacy (app-scoped)
- Privacy nutrition label questionnaire
- Data types and purposes
- Tracking declaration

---

## AI integration (contextual, not a separate section)

AI buttons appear inline when ANTHROPIC_API_KEY is set:
- Store listing: "Translate to…", "Improve" per field, "Generate keywords"
- Reviews: "Suggest reply" per review
- TestFlight: "Generate what to test" from release notes

No AI nav item. Buttons simply don't render without the key.

---

## What we defer

- In-app events
- App Store nominations
- App Clips
- Game Center
- Xcode Cloud
- Certificates/profiles/devices
- Custom product pages and experiments

These can be added later under a "More" or "Advanced" group.

---

## Design principles

1. **Version bar in content header, not sidebar** – frees sidebar for navigation
2. **Task-oriented groups** – Release, Testing, Insights, Configure (not Apple's org chart)
3. **One page per concern** – no dumping grounds, no infinite scrolls
4. **AI woven in** – contextual buttons, not bolted-on features
5. **Status-first overview** – land on what needs attention, not a form
