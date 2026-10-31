# The kernel — why it is shaped this way

Tungsten borrows Filament's *declaration model* (a panel lists its pages; a page names its route, nav entry and
props) but renders everything with Inertia + React, because React can't render inside Filament's Livewire engine.
Routing and rendering are Tungsten's own.

## Panels and the registry

- A `PanelProvider` subclass builds one `Panel` and adds it to the `PanelRegistry` singleton when the registry is
  first resolved.
- Each panel is a route group: prefix `{path}`, name prefix `{id}.`, middleware `config('tungsten.middleware')` +
  `->middleware()` + `can:{ability}` + `HandleTungstenRequests`. `Tungsten::routes($id, fn)` opens that group; sets'
  `routes()` and the panel's `->routes()` run inside it from an `app->booted()` callback (skipped when routes are
  cached), route files call it themselves.
- `PanelRegistry::forRoute()` finds the current panel from the route name's first segment, which is why every panel
  route carries the `{id}.` prefix.

## Routes are plain Laravel (owner decision, 2026-10-31)

Agents and people should find every route with `route:list` and grep, and never fight the framework. So nothing is
generated from page classes: each route is a `Route::get(…)` pointing at a controller or an invokable `Page`, and the
panel reads metadata chained onto it (`RouteMeta`): `->nav()`, `->breadcrumb()`, `->breadcrumbs()`, `->help()`,
`->layout()`. The metadata is stored as plain arrays in the route action under `tungsten`, so `route:cache` (which
`var_export`s the compiled routes) keeps it.

- The sidebar is the panel's parameterless GET routes with `->nav()`, plus `navigationLinks()` / set `links()`,
  grouped in `navigationGroups()` order. A route's `can:` middleware (no extra arguments) and its nav `ability` hide
  its entry. A nav item is active on its own route and on `{route}.*`, so the list stays highlighted on its records.
- Breadcrumbs: `->breadcrumbs([...])` if set; a nav route's group + label; otherwise the parent nav route (the
  longest nav route name that prefixes this one, or `->breadcrumb(parent:)`) as a link plus `->breadcrumb()`'s label.
  A page replaces the shared trail with its own `breadcrumbs` prop (page props win over shared ones);
  `Tungsten::breadcrumbs($leaf)` builds "parent trail + record name".
- A nav `badge` is a string or the class name of an invokable — a closure wouldn't survive `route:cache`.
- Bigint parameters need `->whereNumber()`: on PostgreSQL a non-numeric value on a bigint key is a 500, not a 404.
- Breadcrumbs `find()`, never `findOrFail()`.

## Pages

`Page` is an invokable page controller: `component()` + `props(Request)`, optionally `breadcrumbs(Request)`. It is
a convenience, not a requirement — a plain controller returning `Inertia::render()` is the same to the panel.

## Sets

Parallel work on one panel kept colliding in the provider. A `PanelSet` owns a menu's routes, links and help topics;
`->discoverSets()` picks up every set in a directory, so a new set is a new file.

A set class that is listed but doesn't exist (yet) is **skipped and reported**, not fatal: one session committing a
registration before its class broke every request of the app for everyone else. `PanelRegistry::missingClasses()`
lets a test fail loudly instead.

## Shared props

`HandleTungstenRequests` extends `Inertia\Middleware` with its own root view, `tungsten::app`, so the host app's
`HandleInertiaRequests` (if any, for other package UIs) keeps its own. It shares, lazily: `auth` (user + logout
URL), `panel` (id, label, chip, rail, brand, help URL, home, environment), `panels` (the switcher), `nav`,
`breadcrumbs`, `layout` (the route's `->layout()`) and `flash` (`session('flash')`, a string or `{message, tone}`). React reads them with `usePage()`;
routes and nav are never hard-coded client-side.

## Errors

`Tungsten::handleExceptions()` registers an exception `respond` callback: a 403/404/419/500/503 on a non-JSON
request under a panel path renders `tungsten::errors/Error` through the panel root view, standalone — a 403 from the
gate aborts before the panel's shared props exist. A 500 keeps Laravel's page while `app.debug` is on.

## The shell

`AppLayout` holds the sidebar (fully collapsible on desktop, a drawer on mobile, state in `localStorage`), the
topbar (breadcrumbs, a page's `toolbar`, the help `?`, the user menu), `main`, and an `Aside` slot beside `main`
that pushes the page narrower and resizes from its left edge (`DockResize`).

## Client-side rules

- Kit components must render under Inertia SSR: no `window` / `document` / storage at module scope or during render.
  `lib/browser.js` holds the guards; stored preferences (`usePersistentState`) load after mount; portals render
  nothing on the server. `tests/js-host` renders every kit page with `renderToString` in CI.
- Every href-taking prop accepts a string or `{url, method}` (`lib/href.js`).

- Inertia v3 calls a persistent layout with the page element and **no `.props`**; anything in the layout reads
  `usePage()`.
- `createTungstenApp` flushes the whole prefetch cache after every non-GET visit; Inertia itself drops only the page
  a save lands on.
- inertia-laravel 3 records every request in `local` when `INERTIA_DEVTOOLS_ENABLED` is unset; Tungsten sets it off
  in that case.
