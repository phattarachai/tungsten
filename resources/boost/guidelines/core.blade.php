{{-- Tungsten guidelines for AI code assistants --}}
{{-- Source: https://github.com/phattarachai/tungsten | License: MIT --}}

## Tungsten

- `phattarachai/tungsten` is the app's Inertia + React admin panel: a panel kernel (panels, sets, route metadata, TableQuery, login) and a UI kit imported from `@tungsten` (a Vite alias to `vendor/phattarachai/tungsten/resources/js`).
- IMPORTANT: activate the `tungsten-development` skill whenever you add or change a panel page, a panel route, a set, a TableQuery list, a panel provider, or any JSX under the panel's pages directory (`config('tungsten.vite.pages')`, usually `resources/js/pages/panel`).
- Panel routes are plain Laravel routes inside a set's `routes()`, a panel's `->routes()`, or `Tungsten::routes('admin', fn)`; nav, breadcrumbs, help, width and layout chain onto the route (`->nav()`, `->breadcrumb()`, `->width('4xl')` …). Nothing is generated from page classes.
- A page is as wide as its content: a short form `->width('4xl')`, a list with few columns `->width('fit')` (the table fits its columns instead of spanning the sheet), only a wide list stays full width.
- Build pages from the kit (`AppLayout`, `PageHeader`, `DataTable`, `Filters`, `FormField`, `Facts` …) before writing new markup; `http://<app>/<panel>/ui-kit` shows every component when the UI Kit route is registered.
- Sizes are rem or Tailwind steps, never px (`text-[0.6875rem]`, not `text-[11px]`): the shell scales the rem base to 125%.
- Greys are `zinc-*` (the theme's ramp); a status is a `Badge` with a meaning tone sent by the server (`draft`, `waiting`, `todo`, `active`, `done`, `canceled`, `failed`), never a colour picked in JSX.
- A page prop must not reuse a shared prop's name (`panel`, `panels`, `panel_links`, `nav`, `auth`, `flash`, `errors`): Tungsten throws `ReservedPropName` while debugging.
