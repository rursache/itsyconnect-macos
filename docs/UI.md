# UI conventions

This document defines the UI patterns for Itsyship. Every page and component must follow these conventions to ensure visual consistency. Custom styles are defined in `src/app/globals.css` under `@layer components` – use them instead of ad-hoc Tailwind classes.

## Typography

| Element | Style | Usage |
|---------|-------|-------|
| Page title | `text-2xl font-bold tracking-tight` | One per page, top of content area |
| Section title | `.section-title` class | Form field labels, card section headings |
| Body text | Default (inherits Geist 400 14px) | Paragraphs, descriptions |
| Muted text | `text-sm text-muted-foreground` | Secondary info, help text |

**Font stack:** Geist Sans (body), Geist Mono (code, text inputs). Set globally via `font-sans` on `<body>` in globals.css. Never override with system fonts.

### Custom CSS classes

Defined in `src/app/globals.css` under `@layer components`:

- **`.section-title`** – `text-base font-medium tracking-tight` (Geist 500, 16px). Use for all form section headings. Always on `<h3>` elements, never `<Label>`.

When adding new reusable styles, define them in globals.css as a component class rather than repeating Tailwind utilities.

## Icons

- **Phosphor icons** (`@phosphor-icons/react`) for all application icons
- lucide-react exists as a dependency but is only used internally by shadcn/ui components – never import it directly
- Default size: `size={16}`, use `size={20}` or `size={24}` for larger contexts

## Components

- **shadcn/ui 100%** – every interactive element must use a shadcn component
- Never build custom buttons, inputs, dropdowns, etc. from scratch

## Forms

### Text inputs inside cards

For multi-line text fields (like promotional text, what's new):

```tsx
<section className="space-y-2">
  <h3 className="section-title">Field name</h3>
  <Card>
    <CardContent className="py-3">
      <Textarea
        className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none font-mono text-sm min-h-0"
      />
    </CardContent>
    <div className="flex items-center justify-end border-t px-4 py-2">
      <CharCount value={value} limit={limit} />
    </div>
  </Card>
</section>
```

Key rules:
- All text inputs use `font-mono text-sm` (Geist Mono)
- Textarea inside card: strip border, padding, shadow, ring – the card is the visual container
- Use `field-sizing-content` (shadcn default) instead of `rows` prop so the textarea auto-sizes
- `min-h-0` to remove the default 4rem minimum height
- Character count in a separate border-t footer row

### Section headings

- Use `<h3 className="section-title">` – not `<Label>`, not inline Tailwind
- `<Label>` is only for form controls that need accessible labelling (e.g. switch, checkbox)

## Layout

### Dashboard layout

The dashboard layout (`src/app/dashboard/layout.tsx`) wraps all page content in:

```tsx
<div className="flex flex-1 flex-col gap-4 px-8 pb-8">
  <div className="mx-auto w-full max-w-4xl">
    {children}
  </div>
</div>
```

**All horizontal padding comes from the layout.** Pages must never add their own `px-*` to the root element – this causes double-padding inconsistency.

**Content is capped at `max-w-4xl` (56rem / 896px) and centred.** This keeps form pages readable on wide screens while giving tables enough room. Pages must not override this width – it is set once in the layout.

### Page root patterns

Standard content pages use a simple container:

```tsx
<div className="space-y-6">
  <h1 className="text-2xl font-bold tracking-tight">Page title</h1>
  {/* content */}
</div>
```

Pages with a sticky bottom bar use a flex column:

```tsx
<div className="flex flex-1 flex-col">
  <div className="flex-1 space-y-6">
    {/* scrollable content – no px here, layout handles it */}
  </div>
  <div className="sticky bottom-0 flex items-center justify-end border-t bg-background py-3">
    {/* actions – no px here, layout handles it */}
  </div>
</div>
```

### Sidebar

- Follows the shadcn sidebar-07 pattern (app switcher, grouped nav, footer)
- Nav groups: Release, Testing, Insights, Configure
- Version bar appears in page content header for version-scoped pages, not in the sidebar

### Version bar

Version-scoped pages (store listing, screenshots, app review) show a `<VersionBar>` as their first element with platform/version selectors and status badge.

## Colours

- Status dots use direct Tailwind colours: green-500, blue-500, yellow-500, amber-500, red-500
- Backgrounds use shadcn CSS variables (background, card, muted, etc.) – never hardcode colours for surfaces
- Accent blue gradient for app icons: `bg-gradient-to-b from-blue-500 to-blue-600`
