# Theme and motion

## Steel

- The panel stylesheet's `@theme` sets `--color-zinc-50…950` to a cool steel ramp and `--color-blue-*` to a muted
  steel blue. Every `zinc-*` / `blue-*` utility — in the kit, in host pages, in portalled menus — turns steel with no
  class changes. Pages use `zinc-*` for every grey, never `slate` / `gray` / hex greys.
- Every token is a default the host can redefine in its own `@theme` after the import (owner decision 2026-10-31:
  the theme is overridable beyond the brand colour): greys, blue, brand, rail, `--font-sans`, `--radius`, motion.
- The sidebar is a graphite rail (`--color-rail`, with `rail-hover/active/line/ink/ink-active/muted`). Hover, active
  and line default to `color-mix()`es of the rail toward its ink, so they suit a dark or a light rail, and an app's own
  `@theme` values replace them. `Panel::rail()` inlines a tint on the aside and adds `.panel-rail-tinted`, which
  re-mixes the three there (a `:root` mix can't see a variable set on a child).
- The topbar is `--color-topbar` with `--color-topbar-line` / `--color-topbar-hover`; `AppLayout sheet` draws main on
  `--color-sheet` with a `--color-sheet-line` border, inset 0.5rem right and bottom (left too when the rail is shut,
  top when there is no topbar). Grey chrome + a white sheet is a token change plus `Panel::layout(['sheet' => true])`.
- The accent is `--color-brand`, set on `<html>` by the root view from `->brandColor()` / `tungsten.brand_color`;
  `brand-50/100/400/600/700` are `color-mix()`ed from it, so one hex re-colours the kit.
- `tungsten.css` = `ibm-plex-sans-thai.css` + `kit.css`; an app with its own font imports `kit.css` alone.
- IBM Plex Sans Thai for Thai and Latin, self-hosted (Google's files; another CDN's copies dropped the mai ek over
  sara ii in bold).
- Compact by design (12px base, 40px topbar, 200px sidebar, 28px rows), then `html:has(.panel-shell)` sets the rem
  base to 125% so the density sits beside Filament's. Every size is rem; pages without the shell (the error page)
  keep the 16px base.
- Content over headers: section headers are a `zinc-50` band, table headers are smaller and lighter than cells.
- One control height in headers and toolbars: 1.5rem (`Button size="sm"`, `ActionMenu`, `Dropdown`, `SearchInput`).
- A wrapper that scrolls sideways sets `overflow-x-auto overflow-y-hidden`; with only X the browser makes Y `auto`
  and, at the 125% base, shows a scrollbar with nothing to scroll.

## Motion

- Tokens on `:root` (in `@layer base`, so plain host CSS overrides them): `--motion-fast` 120ms (popovers), `--motion-base` 160ms (dialogs, slide-overs),
  `--motion-page` 180ms, `--motion-ease`. `prefers-reduced-motion` sets them to `0s`.
- Overlays enter, never exit: `animate-panel-fade` (backdrop), `-pop` (dialog), `-slide` (Aside, HelpPanel),
  `-drop` / `-lift` (popovers, picked by `popoverMotion(position)`). `<details>` menus use `group-open:`.
- Page change: `pageTransitionOptions` asks for a view transition only on a plain GET to another path from a panel
  page. Only `main` (and a record header / tab nav that exists on one side) animates; the chrome snaps.
