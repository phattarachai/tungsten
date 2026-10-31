# Changelog

All notable changes to `phattarachai/tungsten` are documented here.

Release notes are drafted automatically from merged pull requests and published on the
[Releases page](https://github.com/phattarachai/tungsten/releases) — that page is the authoritative log.

This file records anything released before that automation landed.

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
