# The kernel — why it is shaped this way

Tungsten borrows Filament's *declaration model* (a panel lists its pages; a page names its route, nav entry and
props) but renders everything with Inertia + React, because React can't render inside Filament's Livewire engine.
Routing and rendering are Tungsten's own.

## Panels and the registry

- A `PanelProvider` subclass builds one `Panel` and adds it to the `PanelRegistry` singleton when the registry is
  first resolved. `TungstenServiceProvider` mounts every panel in an `app->booted()` callback, so panels declared by
  any provider are in, and skips it when routes are cached.
- Each panel is a route group: prefix `{path}`, name prefix `{id}.`, middleware
  `config('tungsten.middleware')` + `->middleware()` + `can:{ability}` + `HandleTungstenRequests`.
- `PanelRegistry::forRoute()` finds the current panel from the route name's first segment, which is why every panel
  route — pages, set endpoints, `->routes()` — carries the `{id}.` prefix.

## Pages

- Every page route's action is `PageController`, which looks the page up by route name. A closure capturing the page
  object would come back from `route:cache` as an incomplete object; a class string serializes.
- `routeKey()` follows resource naming (`orders/{order}/edit` → `orders.edit`), and a nav item is active on its own
  route and on `{route}.*`, so the list stays highlighted on its record pages.
- Route parameters default to `[0-9]{1,18}`: on PostgreSQL a non-numeric or out-of-range value on a bigint key is a
  500, not a 404.
- Breadcrumbs `find()`, never `findOrFail()`.

## Sets

Parallel work on one panel kept colliding in the provider's page list. A `PanelSet` owns a menu's pages, endpoints,
links and help topics; `->discoverSets()` picks up every set in a directory, so a new set is a new file.

A page class that is listed but doesn't exist (yet) is **skipped and reported**, not fatal: one session committing
a set before its page broke every request of the app for everyone else. `PanelRegistry::missingClasses()` lets a
test fail loudly instead.

## Shared props

`HandleTungstenRequests` extends `Inertia\Middleware` with its own root view, `tungsten::app`, so the host app's
`HandleInertiaRequests` (if any, for other package UIs) keeps its own. It shares, lazily: `auth` (user + logout
URL), `panel` (id, label, chip, rail, brand, help URL, home, environment), `panels` (the switcher), `nav`,
`breadcrumbs` and `flash` (`session('flash')`, a string or `{message, tone}`). React reads them with `usePage()`;
routes and nav are never hard-coded client-side.

## Errors

`Tungsten::handleExceptions()` registers an exception `respond` callback: a 403/404/419/500/503 on a non-JSON
request under a panel path renders `tungsten::errors/Error` through the panel root view, standalone — a 403 from the
gate aborts before the panel's shared props exist. A 500 keeps Laravel's page while `app.debug` is on.

## The shell

`AppLayout` holds the sidebar (fully collapsible on desktop, a drawer on mobile, state in `localStorage`), the
topbar (breadcrumbs, a page's `toolbar`, the help `?`, the user menu), `main`, and an `Aside` slot beside `main`
that pushes the page narrower and resizes from its left edge (`DockResize`).

## Client-side traps

- Inertia v3 calls a persistent layout with the page element and **no `.props`**; anything in the layout reads
  `usePage()`.
- `createTungstenApp` flushes the whole prefetch cache after every non-GET visit; Inertia itself drops only the page
  a save lands on.
- inertia-laravel 3 records every request in `local` when `INERTIA_DEVTOOLS_ENABLED` is unset; Tungsten sets it off
  in that case.
