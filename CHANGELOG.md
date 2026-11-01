# Changelog

All notable changes to `phattarachai/tungsten` are documented here.

Release notes are drafted automatically from merged pull requests and published on the
[Releases page](https://github.com/phattarachai/tungsten/releases) — that page is the authoritative log.

This file records anything released before that automation landed.

## v0.2.18 — 2026-11-01

- Fix: a real mouse drag in `DataTable reorderable` / `Sortable` lost its drop. The row moved live, then stayed faded,
  and `onReorder` never fired: moving the row re-inserts it, which drops pointer capture on its handle, and the move
  and up events then went elsewhere. The drag now listens on `window` from pointerdown to pointerup (cancel puts the
  rows back), and text selection is off while dragging.
- A panel's switcher row chip shows its `brand(logo:)` mark, white on the panel colour, like the summary: logo, then
  icon, then `short`. Switcher rows gain `logo` (null for `entry()` rows).

## v0.2.17 — 2026-11-01

- **Page content width** (Filament's `maxContentWidth`): `->width('4xl')` on a route, `<AppLayout width="4xl">`, or a
  panel default via `->layout(['width' => '7xl'])`. Caps the content inside the sheet, left-aligned, so the PageHeader's
  actions sit at the content's edge; the sheet keeps its full size. `sm` … `7xl` or `full` (default). Sizes are rem, so
  in the shell's 125% base `4xl` is 1120px.
- `->layout([...])` now merges with earlier layout metadata on the route instead of replacing it.

## v0.2.16 — 2026-11-01

- **`Sortable`**: a list reordered by drag handles with pointer events (mouse, pen, touch) or ↑ / ↓ on the focused
  handle (focus kept, `aria-label` "ย้ายลำดับที่ N"); live moves, the dragged row fades, `onReorder(items)` once per
  drop / key move; `numbered`, `disabled`. `useSortable` and `SortHandle` for other markup.
- **`DataTable reorderable={{ onReorder }}`**: a handle column, whole rows dragged the same way, sorting off.
- **`DataTable` column `wrap`**: `true` or a width (`'w-96'`) wraps the value to two lines at that width with the full
  text as the tooltip.

## v0.2.15 — 2026-11-01

- Fix: a width passed in `className` lost to a field's own `w-full` (`cn` only joins classes). `Input`, `Textarea`,
  `Select`, `Combobox`, `DatePicker` / `DateTimePicker` and `DateRangePicker` now drop their `w-full` when the caller
  sets a width (`w-*`, `size-*`, `basis-*`, with any variant); `max-w-*` / `min-w-*` still bound the default.
  `DateRangePicker` takes `className`.

## v0.2.14 — 2026-11-01

- **`RadioGroup`**: one choice among `{ value, label, description?, disabled? }` as native radios (Tab enters, arrows
  move), `layout` `list` (bordered rows), `cards` or `inline`, `invalid` for the red frame under a `FormField error`.
- **`Checkbox`**: label, `hint`, `error`, `indeterminate`; `onChange(checked)`.

## v0.2.13 — 2026-11-01

- **`StatsStrip`**: a row of figures (`{ label, value, hint?, tone?, href? }`) with hairlines, 2 / 3 / 6 columns by
  container width.
- **Record parts**: `Heading` (text, with `actions`), `Rule` (the hairline), `Facts` (label–value rows, no boxes).
- **`sendJson` / `getJson` / `postJson`**: JSON calls with the XSRF cookie; a 422's field errors as `errors`.
- **`Avatar`** falls back to the initial when its photo fails to load, and so do `Combobox` option avatars; the
  initial comes from `person.name` when `person.initial` isn't given.
- The status tones' ink / dot classes live in one map (`lib/tones.js`), shared by `Pills`, the env line and
  `StatsStrip`.

## v0.2.12 — 2026-11-01

- `Combobox` options may carry `avatar` (an image URL, or null for the initial): a small round avatar before the label
  in the list and in the chosen value. Options without the key look as before.
- Initials skip a Thai leading vowel (เกศินี → ก) in `Combobox` and `AvatarStack` (`initialOf()`).

## v0.2.11 — 2026-11-01

- Fix: the flash toast sat behind a dialog's overlay (both `z-50`). It now portals to `body` at `z-[70]`, above
  dialogs, the Aside and the Lightbox.
- Fix: the same flash message on two responses in a row didn't show again. The shared `flash` gains an `id`, new on
  every response that carries a message, and the toast keys on it.

## v0.2.10 — 2026-11-01

- **Environment indicator**: `tungsten.environments` (env → `{label, tone}` or null, over the kit defaults: production
  nothing, local Local/active, staging Staging/done, uat UAT/todo; others their own name in `draft`), shared as
  `panel.env`. A "• Label" line in the tone's ink under the brand in the switcher head and on the login page, a tone
  `Badge` in the compact switcher, and a "Label · " tab-title prefix (root view `<meta name="tungsten-env">` and the
  first-paint `<title>`). The topbar's yellow environment chip is gone.

## v0.2.9 — 2026-10-31

- **Lightbox**: `LightboxProvider` (AppLayout provides it), `Zoomable` (`images` + `index`, or `src` / `full` / `alt`;
  brings its own viewer outside a provider) and `useLightbox()`. Full-screen image with caption and "n / N", ← / →
  and buttons, Escape / × / click outside to close, focus trapped and restored, page scroll locked, SSR-safe.
- `Thumb zoom` (`true` or `{ images, index }`, `full` for the large file) and `Avatar zoom`.
- DOM checks for the viewer in `tests/js-host` (`npm run unit`).

## v0.2.8 — 2026-10-31

- **Switcher footer links**: `PanelRegistry::link($label, $url, icon:, image:, ability:)` (chains after `entry()`),
  shared as `panel_links` and drawn under the switcher rows as a two-column grid of small links that open a new tab.
  `panel_links` joins the reserved prop names.
- **Brand logo**: `->brand($label, icon:, tag:, logo:)` takes a single-colour SVG (public path or URL), drawn white as
  a CSS mask on the panel-colour chip in the sidebar head, the topbar's compact switcher and the login page; logo,
  then icon, then `short`. Switcher rows are unchanged.
- **Favicon pair**: `tungsten.favicon` takes one path or a list (each linked with its type, e.g. PNG then SVG), and
  `tungsten.apple_touch_icon` adds the home-screen icon.

## v0.2.7 — 2026-10-31

- Guard: a panel page returning a prop the panel shares (`panel`, `panels`, `nav`, `auth`, `flash`, `errors`) now
  throws `ReservedPropName` while debugging and is reported in production, instead of silently replacing the shared
  value and crashing `AppLayout`. Checked on Laravel's `PreparingResponse` event, so it covers `Page` classes and plain
  controllers alike. `breadcrumbs` and `layout` stay overridable.

## v0.2.6 — 2026-10-31

- Fix: after the Filters clear-all, the search text stayed in the box. `SearchInput` (with `onSearch`) now follows
  `value` when it changes from outside and the box isn't focused (clear-all, back / forward), cancelling a pending
  debounced search; `Filters` empties the box at once on clear-all. Checked in a DOM under Node
  (`tests/js-host/dom-check.jsx`, jsdom, part of `npm run unit`).

## v0.2.5 — 2026-10-31

The project's list shape for `<Filters layout="bar">`:

- Row 1: the date presets and custom range; row 2: the search first, then the other filters, then a clear-all icon
  (`FilterX`, "ล้างตัวกรองทั้งหมด") that also empties the search; `row: 'below'` filters a third row. Was: search at
  the end of row 1 and a text clear-all.
- New filter type `dates` (presets + ทั้งหมด + วันที่กำหนดเอง with a range picker on `from` / `to`), in both layouts.
- `search` may be `{ value, placeholder, onSearch?, key? }`, drawn as a `SearchInput` that clear-all resets; a node
  still works. `row: 'top'` places any filter in row 1; `buttons` / `pills` outside it show their label.
- `FilterBar` takes a `top` row. The menu layout is unchanged.

## v0.2.4 — 2026-10-31

- **Optional panel login**: `->login(guard:, labels:, forgotPasswordUrl:, authorize:)` adds `{path}/login` and
  `{path}/logout` in the panel's theme. Guests on the panel go there (its `auth` becomes `AuthenticatePanel`), sign in
  against the guard's user provider with remember-me and a throttle, must pass the panel ability and the `authorize`
  hook, and return to the intended URL. Labels in `tungsten.login.labels`. The user menu signs out through the panel.
- Panels without `->login()` are unchanged.
- **Status tones**: `Badge` tones `draft`, `waiting`, `todo`, `active`, `done`, `canceled`, `failed` (bold, with a
  warning icon), from `--color-tone-<name>` / `-ink` tokens with AA defaults; a `Pills` option's `tone` colours its
  count. The colour tones and aliases are unchanged.

## v0.2.3 — 2026-10-31

- Fix: `useTableQuery` now drops a filter's indexed values (`type[0]`, `type[1]`, as Inertia writes them) when it
  clears or changes the filter, so old array values no longer linger in the URL. The URL logic is `applyQuery()`
  (exported), checked under Node in CI (`tests/js-host`, `npm run unit`).

## v0.2.2 — 2026-10-31

List parts for Filament-like lists (non-breaking):

- `Filters`: one filter definition drawn as a bar above the table (`bar`) or a dropdown with active-filter chips
  (`menu`). Default from `tungsten.filter_layout` (`bar`), per panel `->filterLayout()`, per page `layout`; shared as
  `panel.filterLayout`.
- `FilterBar` (+ `FilterField`), `FilterMenu`, `FilterChip`: the parts, for a layout of your own.
- `AvatarStack`, `Thumb`.
- `DataTable`: column `valign: 'top'` (or table `valign`), `plainLinks` for a plain `<a>` row link.
- `Combobox size="sm"` with `label` (and a capped width) for a filter bar; `ButtonGroup size="sm"`.
- `Pills` scrolls sideways instead of overflowing.
- `Pagination onPerPage` / `perPageOptions`; `useTableQuery().setPerPage`.
- README: exclude `./pages/panel/**` from another Inertia entry's eager glob.

## v0.2.1 — 2026-10-31

Theme hooks for a light chrome; non-breaking, the defaults keep the steel look:

- Tokens: `--color-rail-ink-active` (active and hovered nav text, was hard-coded white), `--color-topbar`,
  `--color-topbar-line`, `--color-topbar-hover`, `--color-sheet`, `--color-sheet-line`.
- Rail hover / active / line are `@theme` defaults mixed toward `--color-rail-ink` (light rails work, app values win);
  a `Panel::rail()` tint re-mixes them on the aside via `.panel-rail-tinted`.
- `AppLayout sheet`: main as one rounded sheet inset in the chrome, reaching the viewport bottom.
- `Panel::layout([...])`: panel-wide `AppLayout` defaults, merged under a route's `->layout()`.
- `TableToolbar flush` and `Pagination flush`, to line up with `DataTable flush`.
- `resources/css/kit.css`: the theme without the IBM Plex Sans Thai font files.

## v0.2.0 — 2026-10-31

Owner decisions folded in the same day as v0.1.0 (breaking — v0.1.0 had no consumers):

- **Routes are plain Laravel.** Nothing is generated from page classes. Declare `Route::get(…)` in a set's
  `routes()`, the panel's `->routes()`, or a route file inside `Tungsten::routes('admin', fn)`, and chain metadata:
  `->nav()`, `->breadcrumb()`, `->breadcrumbs()`, `->help()`, `->layout()`. Removed: `Page::path()` and the nav
  methods, `Panel::pages()` / `->home()`, `PanelSet::pages()`, `PageController`.
- `Page` is an invokable page controller (`component()`, `props()`, `breadcrumbs()`); `Tungsten::breadcrumbs($leaf)`.
- `make:tungsten-page` prints the route line to declare instead of relying on registration.
- Every kit `href` prop accepts a string or a Wayfinder-style `{url, method}`; `ActionMenu` / `RowActions` items take
  `href`.
- SSR-safe kit: no DOM or storage access at module scope or during render; `createTungstenApp` works as an SSR entry;
  CI renders every kit page under Node.
- Theme tokens (greys, blue, brand, rail, font, `--radius`, motion) live in `@theme` / `:root` and are overridable in
  the host's CSS; `tungsten.brand_color` may be null to theme the accent in CSS only.
- `AppLayout` takes `sidebar={false}`, `topbar={false}`, `className`, `mainClassName`; its parts are exported.

## v0.1.0 — 2026-10-31

First release: the panel kernel and UI kit, extracted from an in-house Inertia + React admin.

- `Panel`, `Page`, `PanelRegistry`, `PanelProvider` and `PanelSet` (with `discoverSets()`); routes on a cache-safe
  `PageController`; numeric route parameters by default; missing page classes skipped and reported.
- The panel's own root view and Inertia middleware with shared `auth`, `panel`, `panels`, `nav`, `breadcrumbs`,
  `flash`; Inertia error pages via `Tungsten::handleExceptions()`.
- `TableQuery`: whitelisted sort, search (relations, LIKE-escaped, `ilike` opt-in), filters, pagination.
- `tungsten:install` and `make:tungsten-page`.
- The JS kit (~45 components, `AppLayout` and chrome, `createTungstenApp`, `useTableQuery`), the steel theme with a
  configurable brand colour, IBM Plex Sans Thai, Thai strings in one object, the UI Kit page.
