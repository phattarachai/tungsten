---
name: tungsten-development
description: 'Build Tungsten admin panel pages (phattarachai/tungsten, Inertia + React): a list with TableQuery, filters and DataTable; a record (detail) page; a form or dialog; a new set of routes; panel wiring (PanelProvider, sets, login, nav, breadcrumbs, width). Use whenever code touches a panel route, a PanelSet, a Tungsten Page class, `TableQuery`, or JSX that imports from `@tungsten` or lives in the panel pages directory. Triggers: "add a panel page", "port this Filament resource/page to the panel", "new list page", "record page", "add a set", "panel filter", "reorder rows", "kit component".'
license: MIT
metadata:
  author: Phattarachai Artisan
---

# Tungsten Development

Tungsten is the app's Inertia + React admin panel: a PHP kernel (panels, sets, route metadata, `TableQuery`, optional
login) and a React kit imported from `@tungsten`. A page is a plain Laravel route whose controller (or `Page` class)
renders an Inertia component; the JSX composes kit parts inside `AppLayout`.

## When to activate

- Adding or changing a panel page, list, record page, form, dialog or set.
- Porting a Filament resource or page to the panel.
- Code references `Phattarachai\Tungsten\…`, `TableQuery`, `->nav(` / `->breadcrumb(` / `->width(` on a route, or
  imports from `@tungsten`.

## Workflow

1. **Read the project's own rules first.** The app may keep panel rules (in `.ai/rules/`, `CLAUDE.md` or a docs
   folder) that pick between kit options: the filter layout (bar or menu), page widths, status tone maps, wording.
   They win over the defaults here.
2. **Inventory what you're replacing.** For a Filament port, list every column, filter, action and widget, and the
   question each answers. Drop what answers none; keep every action that has a real use.
3. **Server** — routes, a `Page` class or controller, props, `TableQuery`: see `references/server.md`.
4. **Client** — the JSX page from kit parts: see `references/pages.md` for the list / record / form recipes and
   `references/kit.md` for the components.
5. **Test** — a Pest feature test per page: the route answers for an allowed user and is forbidden otherwise, the
   props carry what the page shows (`assertInertia`), filters/sort/search change the rows, and every write path
   validates. Then build (`npm run build`) and open the page in a browser: a white page is a JS error, not missing data.

## Rules that hold on every page

- **Routes are plain Laravel.** Declare them in a set's `routes()` (or the panel's `->routes()`, or
  `Tungsten::routes('admin', fn)`); chain panel metadata onto them. Nothing is generated from page classes.
  A bigint route parameter gets `->whereNumber('order')`.
- **Kit first.** Use a kit component before writing markup; extend the kit (not the page) when a pattern repeats
  across pages.
- **rem, never px.** The shell scales the rem base to 125%: `text-[0.6875rem]`, `max-w-80`, never `text-[11px]`.
- **Greys are `zinc-*`, accent is `brand`.** The theme maps them; don't use `slate`/`gray`/hex greys or pick colours
  for meaning.
- **Status = `Badge tone`, sent by the server, by meaning:** `draft` (not started), `waiting` (on someone outside),
  `todo` (our turn), `active` (in progress), `done`, `canceled` (or expired), `failed` (an error to fix). Never a
  colour name, never grey text for a status.
- **Shared props are reserved.** A page prop named `panel`, `panels`, `panel_links`, `nav`, `auth`, `flash` or
  `errors` replaces the shared one and breaks the shell; Tungsten throws `ReservedPropName` in debug. Override
  `breadcrumbs` / `layout` only on purpose.
- **Inertia v3 layout callbacks get no `.props`.** A layout or toolbar reads page props with `usePage()`.
- **Only the key cell links to a record** (`primary: true` column + `rowHref`); a row is not one big link.
- **Images open full screen**: `Thumb zoom`, `Avatar zoom` or `Zoomable`.
- **Dates**: the kit pickers (`DatePicker`, `DateRangePicker`), values ISO Gregorian, shown in พ.ศ.
- **Width follows content**: short forms and small record pages `->width('4xl')` (two columns `'5xl'`); a list with
  few columns `->width('fit')`, so the table hugs its columns instead of spanning the sheet (no spacer column
  needed); lists with many columns and wide record pages stay `full`.
- **Thai-first copy** from the server or `strings`; the kit's own words are overridable with `setStrings()`.

## References

- `references/server.md` — panels, sets, routes and metadata, `Page` classes, `TableQuery`, login, tests.
- `references/pages.md` — recipes: list page, record page, form / dialog, reorder mode, JSON calls.
- `references/kit.md` — every kit component and its main props.
