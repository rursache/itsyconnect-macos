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

- Sidebar follows the shadcn sidebar-07 pattern (app switcher, collapsible nav, footer)
- Pages that need full-bleed elements (sticky bottom bars, custom headers) use `overflow-hidden` on the layout's `<main>` and handle their own scrolling
- Pages with standard content use `overflow-auto p-6` on their root div

## Colours

- Status dots use direct Tailwind colours: green-500, blue-500, yellow-500, amber-500, red-500
- Backgrounds use shadcn CSS variables (background, card, muted, etc.) – never hardcode colours for surfaces
- Accent blue gradient for app icons: `bg-gradient-to-b from-blue-500 to-blue-600`
