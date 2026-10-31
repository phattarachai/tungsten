# Tungsten

[![Latest Version on Packagist](https://img.shields.io/packagist/v/phattarachai/tungsten.svg?style=flat-square)](https://packagist.org/packages/phattarachai/tungsten)
[![Tests](https://img.shields.io/github/actions/workflow/status/phattarachai/tungsten/run-tests.yml?branch=main&label=tests&style=flat-square)](https://github.com/phattarachai/tungsten/actions/workflows/run-tests.yml?query=branch%3Amain)
[![Code Style](https://img.shields.io/github/actions/workflow/status/phattarachai/tungsten/fix-php-code-style-issues.yml?branch=main&label=code%20style&style=flat-square)](https://github.com/phattarachai/tungsten/actions/workflows/fix-php-code-style-issues.yml?query=branch%3Amain)
[![PHP Version](https://img.shields.io/packagist/dependency-v/phattarachai/tungsten/php?style=flat-square&label=php&logo=php&logoColor=white)](https://packagist.org/packages/phattarachai/tungsten)
![Laravel Version](https://img.shields.io/badge/laravel-12%20%7C%2013-FF2D20?style=flat-square&logo=laravel&logoColor=white)
[![Total Downloads](https://img.shields.io/packagist/dt/phattarachai/tungsten.svg?style=flat-square)](https://packagist.org/packages/phattarachai/tungsten)

An admin panel kernel and UI kit for Laravel, built on Inertia + React. It replaces a Filament admin with pages you
write by hand in JSX, from a dense, Thai-first component kit, with PHP helpers that do the repetitive parts.

- **Panels** with their own path, gate, sidebar nav, switcher, breadcrumbs and help.
- **Plain Laravel routes** carry the panel metadata: `Route::get('orders', …)->name('orders')->nav('คำสั่งซื้อ')`.
- **Pages** are JSX you write, rendered by a controller or a small invokable `Page` class. No declarative resources.
- **Sets** group a menu's routes in one class, so several people (or agents) add pages in parallel without touching
  the panel provider.
- **A kit** of ~45 React components: `DataTable`, `TableToolbar`, `Pagination`, filter `Dropdown`, `Combobox`,
  `FormField`, `FormDialog`, `ConfirmDialog`, `RecordLayout`, `GroupedNav`, `Aside`, Buddhist-era (พ.ศ.)
  `DatePicker` / `DateRangePicker`, `Timeline`, `Stepper`, `TreeTable` and the shell around them.
- **`TableQuery`**: a server-side list from the query string — whitelisted sort, search, filters, pagination.
- **Generators**: `make:tungsten-page Orders/Index --model=Order` writes the page class and its JSX.
- **SSR-safe**, **themeable by CSS tokens**, and every link prop takes a string or a Wayfinder-style `{url, method}`.

The kernel and kit were extracted from a production Laravel app that moved its admin off Filament in 2026.

## Requirements

- PHP 8.4, Laravel 12 or 13, `inertiajs/inertia-laravel` 3
- React 19, `@inertiajs/react` 3.9+, Tailwind CSS 4, Vite
- `lucide-react` (icons). Nothing else on the npm side.

The JS ships inside the Composer package and is reached through a Vite alias into `vendor/` — there is no npm
package to install or keep in sync.

## Install

```bash
composer require phattarachai/tungsten
php artisan tungsten:install
```

`tungsten:install` publishes `config/tungsten.php`, writes the panel's Vite entry `resources/js/tungsten.jsx` and its
stylesheet `resources/css/tungsten.css` (it never overwrites without `--force`), and prints the steps below. Add
`--provider` to also write and register `app/Providers/TungstenPanelProvider.php`.

**1. npm packages** (peer dependencies the kit imports):

```bash
npm install @inertiajs/react@^3.9 react@^19 react-dom@^19 lucide-react@^1
```

Plus, if the app doesn't have them yet: `tailwindcss@^4`, `@tailwindcss/vite@^4`, `laravel-vite-plugin` and the
`@vitejs/plugin-react` major that matches your Vite (`^5` for Vite 7, `^6` for Vite 8).

**2. `vite.config.js`** — add the entry, the alias, and dedupe React so the vendor files share the app's copy:

```js
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
    plugins: [
        laravel({ input: [/* ... */ 'resources/js/tungsten.jsx'] }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@tungsten': path.resolve(__dirname, 'vendor/phattarachai/tungsten/resources/js'),
        },
        dedupe: ['react', 'react-dom', '@inertiajs/react', 'lucide-react'],
    },
})
```

**3. `bootstrap/app.php`** — friendly Inertia error pages (403/404/419/500/503) under panel paths:

```php
use Phattarachai\Tungsten\Tungsten;

->withExceptions(function (Exceptions $exceptions): void {
    Tungsten::handleExceptions($exceptions);
})
```

**4. A gate.** Every panel route is behind `can:access{Id}` (`accessAdmin` for a panel with id `admin`). Define it,
name another ability with `->ability('...')`, or turn it off with `->ability(null)`:

```php
Gate::define('accessAdmin', fn (User $user): bool => $user->is_admin);
```

The files `tungsten:install` wrote:

```jsx
// resources/js/tungsten.jsx
import '../css/tungsten.css'

import { createTungstenApp } from '@tungsten'

createTungstenApp({
    pages: import.meta.glob('./pages/panel/**/*.jsx'),
})
```

```css
/* resources/css/tungsten.css */
@import 'tailwindcss';
@import '../../vendor/phattarachai/tungsten/resources/css/tungsten.css';

@source '../js/pages/panel';
```

The panel renders through **its own root view and Inertia middleware** (`tungsten::app`,
`HandleTungstenRequests`), so an app that already has an Inertia root for something else keeps it untouched. The
root view loads `tungsten.vite.entry` and modulepreloads the current page's chunk.

## How it fits together

Tungsten is a kit, helpers and conventions — not a framework that owns your pages.

- **Routes are plain Laravel.** You declare every route with `Route::get(…)` in a route file or a set, pointing at a
  controller or an invokable page class. Nothing is generated from page classes, so `php artisan route:list` and a
  grep show everything. Panel metadata (nav entry, breadcrumb, help, layout) is chained onto the route.
- **Pages are JSX you write.** The shell (`AppLayout`) is opt-in per page, every part of it can be dropped, and any
  page can be plain JSX + Tailwind with only the kit pieces it wants.
- **Auth is yours.** Panels run behind `config('tungsten.middleware')` (default `['web', 'auth']`) and a gate; any
  login works — Laravel's, Filament's, Google SSO. Tungsten's own login and profile pages (v0.3) are optional.

## Register a panel

One provider per panel, listed in `bootstrap/providers.php`:

```php
namespace App\Providers;

use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelProvider;

class AdminPanelProvider extends PanelProvider
{
    public function id(): string
    {
        return 'admin';                          // route names are admin.*, the gate is accessAdmin
    }

    public function panel(Panel $panel): Panel
    {
        return $panel
            ->path('admin')                      // mounted at /admin
            ->label('ร้านค้า')
            ->brand('My Shop', 'store', 'v2')    // sidebar head: name, icon, tag
            ->brandColor('#0d9488')              // accent; or theme it in CSS, see "Theme"
            ->middleware(['panel.enabled'])      // on top of config('tungsten.middleware')
            ->navigationGroups(['การขาย', 'ลูกค้า', 'ระบบ'])
            ->discoverSets(app_path('Panel/Sets'), 'App\\Panel\\Sets');
    }
}
```

Other options: `->ability('…' | null)`, `->sets([...])`, `->routes(fn () => …)`, `->navigationLinks([...])`,
`->help(fn ($routeName) => $url)`, `->logoutUrl('logout' | url | closure | false)`, `->rail('#14262a')` (sidebar tint),
`->color()` / `->icon()` / `->short()` (switcher chip), `->business()`, `->replaces('filament')`.

**The switcher** lists every panel the user may open. Add a row for something that isn't a Tungsten panel — the
Filament admin you are migrating from — and `->replaces('filament')` on the new panel draws it as a chip on that row:

```php
app(PanelRegistry::class)->entry(id: 'filament', label: 'ระบบเดิม', url: '/', short: 'v1', color: '#7c2d12');
```

## Declare routes

Three places, all the same route group (the panel's path prefix, middleware, gate and `{id}.` name prefix):

```php
// a route file — routes/admin.php, required from routes/web.php
use Phattarachai\Tungsten\Tungsten;

Tungsten::routes('admin', function () {
    Route::get('/', HomePage::class)->name('dashboard')->nav('หน้าหลัก', icon: 'layout-grid', sort: -1);
    Route::get('orders', [OrderController::class, 'index'])->name('orders')->nav('คำสั่งซื้อ', icon: 'shopping-cart', group: 'การขาย');
});

// a set's routes() (below), or the panel's ->routes(fn () => …)
```

The metadata a route can carry:

| Macro | What it does |
|---|---|
| `->nav($label, icon:, group:, sort:, badge:, ability:)` | a sidebar entry. `icon` is a lucide name; `badge` a string or the class of an invokable returning one per request (a count); `ability` hides it. A route's own `can:` middleware hides it too. Only parameterless GET routes. |
| `->breadcrumb($label, parent:)` | the trail's last label. The parent nav route — inferred from the name (`admin.orders.edit` → `admin.orders`) or given — links before it. |
| `->breadcrumbs([...])` | a fixed trail: `[['label' => 'ตั้งค่า'], ['label' => 'SMS', 'route' => 'admin.settings.sms']]`. |
| `->help($url)` | the topbar `?` for this route. |
| `->layout([...])` | defaults for `AppLayout` (`flush`, `sidebar`, `topbar`, `className`, `mainClassName`), shared as the `layout` prop. |

Without metadata a nav route's trail is its group and label. A controller replaces the trail by passing a
`breadcrumbs` prop; `Tungsten::breadcrumbs($order->number)` gives the parent trail ending in a record name.

The metadata lives in the route action, so `route:cache` keeps it. Give bigint parameters `->whereNumber()` — a
non-numeric value on a PostgreSQL bigint key is a 500, not a 404.

## Add a page

A page is either a plain controller that returns `Inertia::render('panel/orders/Index', [...])`, or an invokable
`Page` class — a component and its props:

```bash
php artisan make:tungsten-page Orders/Index --model=Order --label=คำสั่งซื้อ
```

writes `app/Panel/Pages/Orders/IndexPage.php` and `resources/js/pages/panel/orders/Index.jsx` (a `TableQuery` list with
search, sort and pagination), and prints the route to declare — it never registers one:

```php
Route::get('orders', IndexPage::class)->name('orders')->nav('คำสั่งซื้อ');
```

`Orders/Show` prints `Route::get('orders/{order}', ShowPage::class)->name('orders.show')->whereNumber('order')->breadcrumb(…)`;
`--path` overrides the path.

```php
use Phattarachai\Tungsten\Page;
use Phattarachai\Tungsten\Table\TableQuery;

class IndexPage extends Page
{
    public function component(): string
    {
        return 'panel/orders/Index';    // resources/js/pages/panel/orders/Index.jsx
    }

    public function props(Request $request): array
    {
        return [
            'orders' => TableQuery::for(Order::query()->with('customer'), $request)
                ->search(['number', 'customer.name'], operator: 'ilike')
                ->filter('status', in: OrderStatus::values())
                ->sorts(['number', 'total', 'created_at'])
                ->defaultSort('created_at', 'desc')
                ->paginate(fn (Order $order): array => [
                    'id' => $order->id,
                    'number' => $order->number,
                    'url' => route('admin.orders.show', $order),
                ]),
        ];
    }
}
```

`Page` also has `breadcrumbs(Request): ?array` to replace the trail (use `find()`, never `findOrFail()`).

Its JSX:

```jsx
import { Head } from '@inertiajs/react'
import { AppLayout, DataTable, PageHeader, Pagination, SearchInput, TableToolbar, useTableQuery } from '@tungsten'

const COLUMNS = [
    { key: 'number', label: 'เลขที่', primary: true, sortable: true },
    { key: 'customer', label: 'ลูกค้า', className: 'w-full' },
]

export default function Index({ orders }) {
    const query = useTableQuery()

    return (
        <>
            <Head title="คำสั่งซื้อ" />
            <PageHeader title="คำสั่งซื้อ" />
            <div className="mt-3 overflow-hidden rounded border border-zinc-200 bg-white">
                <TableToolbar>
                    <SearchInput value={orders.search} onSearch={query.setSearch} />
                </TableToolbar>
                <DataTable flush columns={COLUMNS} rows={orders.rows} rowHref={(row) => row.url} sort={orders.sort} onSort={query.setSort} />
                <Pagination paginator={orders.pagination} onPage={query.setPage} />
            </div>
        </>
    )
}

Index.layout = (page) => <AppLayout>{page}</AppLayout>
```

## Add a set

A set is one menu's routes, links and help topics. With `->discoverSets(...)` a new set is a new file — nobody edits
the provider:

```php
namespace App\Panel\Sets;

use Phattarachai\Tungsten\PanelSet;

class OrdersSet extends PanelSet
{
    public static function routes(): void
    {
        Route::get('orders', IndexPage::class)->name('orders')->nav('คำสั่งซื้อ', icon: 'shopping-cart', group: 'การขาย');
        Route::get('orders/{order}', ShowPage::class)->name('orders.show')->whereNumber('order');
        Route::get('orders/{order}/edit', [OrderController::class, 'edit'])->name('orders.edit')->whereNumber('order')->breadcrumb('แก้ไข');
        Route::put('orders/{order}', [OrderController::class, 'update'])->name('orders.update')->whereNumber('order');
    }

    public static function links(): array   // pages not built yet, still on the old admin
    {
        return [['label' => 'นำเข้าคำสั่งซื้อ', 'url' => '/orders/import', 'group' => 'การขาย', 'legacy' => true]];
    }

    public static function helpTopics(): array   // route-name pattern → handbook URL for the topbar ?
    {
        return ['admin.orders*' => '/help/orders'];
    }
}
```

A listed set class that doesn't exist is skipped and reported, never fatal. Assert
`app(PanelRegistry::class)->missingClasses()` is empty in a test so a typo can't hide.

Forms post to plain controllers + FormRequests that redirect back `with('flash', 'บันทึกแล้ว')` (or
`['message' => …, 'tone' => 'success|info|warning|error']`); the shell shows it as a toast.

## `TableQuery`

| Call | Query string | Returns in the table prop |
|---|---|---|
| `->sorts(['number', 'customer' => '(select …)'])`, `->defaultSort('created_at', 'desc')` | `?sort=number&dir=desc` (other keys ignored) | `sort: {key, dir}` |
| `->search(['number', 'customer.name'], operator: 'ilike')` or `->search(fn ($q, $term) => …)` | `?search=` (LIKE-escaped, relations via `whereHas`) | `search` |
| `->filter('status', in: [...])`, `->filter('type', fn ($q, $types) => …, multiple: true)` | `?status=paid`, `?type[]=a&type[]=b` | `filters: {status, type}` |
| `->perPage(25, [25, 50, 100])` | `?per_page=`, `?page=` | `pagination: {current_page, last_page, per_page, total, from, to}` |

Blank values sort last in both directions, the model key breaks ties, and `->query()` gives the filtered, sorted
builder for an export. In JSX, `useTableQuery()` gives `setSearch`, `setSort`, `setPage`, `setFilter`, `setFilters`
and `clear`, each a `preserveState` visit that resets to page 1 (except `setPage`).

## The kit

Everything is exported from `@tungsten`. To see each component in its states under your panel's colours, route the
UI Kit page (outside production):

```php
Route::get('ui-kit', UiKitPage::class)->name('ui-kit')->nav('UI Kit', icon: 'palette', sort: 1000);
Route::post('ui-kit/toast', UiKitToastController::class)->name('ui-kit.toast');
```

- **Shell**: `AppLayout` (`toolbar`, `flush`, `sidebar={false}`, `topbar={false}`, `className`, `mainClassName`), and
  its parts for a layout of your own: `Sidebar`, `Topbar`, `PanelSwitcher`, `FlashToast`, `TooltipLayer`, `Aside`.
- **Lists**: `DataTable` (sortable, selection, row actions, groups with subtotals, sticky columns), `DataList`,
  `TreeTable`, `TableToolbar`, `Pagination`, `Pills`, `SearchInput`, `Dropdown`, `ColumnsMenu`, `SelectionBar`.
- **Forms**: `FormField` (inline label, `hint`, `info`, `error`), `Input`, `Select`, `Textarea`, `Combobox`
  (searchable, multiple), `Switch`, `DatePicker` / `DateTimePicker` / `DateRangePicker` (values stay ISO
  Gregorian; display is พ.ศ.), `FormDialog`, `ConfirmDialog`, `Dialog`.
- **Records**: `RecordLayout`, `PageHeader`, `GroupedNav`, `NavList`, `RecordPager`, `Section`, `SectionGrid`,
  `TabSection`, `DetailList`, `Timeline`, `Stepper`, `AuditPanel`, `LastEdited`.
- **Buttons**: `Button` (`solid · outline · ghost` × `neutral · brand · amber · blue · danger`), `IconButton`,
  `ActionMenu`, `RowActions`, `ButtonBar`, `ButtonGroup`, `SyncButton`, `Badge`.

Components take `className` where it makes sense; nothing stops a page from using plain elements beside them.

### Links: a string or `{url, method}`

Every kit prop that takes an `href` — nav items, `NavList` / `GroupedNav` items, `RecordPager`, `DataTable rowHref`,
`ActionMenu` / `RowActions` items (`href` instead of `onSelect`), `HelpLink`, breadcrumbs, the logout target —
accepts a URL string or a Wayfinder-style `{url, method}` object; a non-GET target renders as a button visit.
Tungsten doesn't depend on Wayfinder; server-built URLs passed as props work the same. `urlOf`, `methodOf` and
`linkProps` are exported for your own components.

### SSR

The kit renders under Inertia SSR: nothing touches `window`, `document` or storage at module scope or during render
(stored view preferences load after mount). An SSR entry:

```jsx
// resources/js/ssr.jsx
import createServer from '@inertiajs/react/server'
import { renderToString } from 'react-dom/server'
import { createTungstenApp } from '@tungsten'

createServer((page) => createTungstenApp({ page, render: renderToString, pages: import.meta.glob('./pages/panel/**/*.jsx') }))
```

CI renders every kit page with `renderToString` under Node to keep it that way.

### Icons

Nav icons are kebab-case lucide names resolved through a static registry, so the bundle holds only the icons in
use. The kit registers ~60 common ones; add yours in the entry (or pass a component as `icon` directly):

```jsx
import { Pill, Stethoscope } from 'lucide-react'
import { createTungstenApp, registerIcons } from '@tungsten'

registerIcons({ pill: Pill, stethoscope: Stethoscope })
```

### Strings

Every string the kit draws is Thai by default and lives in one object. Reword or translate it before the app mounts:

```js
import { setStrings } from '@tungsten'

setStrings({ save: 'Save', cancel: 'Cancel', noData: 'No data' })
```

### Theme

The kit is styled with Tailwind utilities against theme tokens, and the "steel" theme is just their defaults.
Redefine any of them in your panel stylesheet after the import:

```css
@import 'tailwindcss';
@import '../../vendor/phattarachai/tungsten/resources/css/tungsten.css';

@theme {
    --color-brand: #0d9488;                       /* accent: primary buttons, key cells, active marks */
    --font-sans: 'Sarabun', ui-sans-serif, sans-serif;
    --radius: 0.375rem;                           /* `rounded`; also --radius-md / --radius-lg */
    --color-zinc-100: #f1f1f1;                    /* any step of the grey ramp (steel by default) */
    --color-rail: #14262a;                        /* the sidebar */
}
```

| Token | Default | Used for |
|---|---|---|
| `--color-zinc-50…950` | steel greys | every grey in the kit and in pages written with `zinc-*` |
| `--color-blue-50…950` | muted steel blue | the info tone |
| `--color-brand` (+ `-50/100/400/600/700` mixed from it) | `#ba1a1a` | the accent |
| `--color-rail`, `--color-rail-ink`, `--color-rail-muted` | graphite | the sidebar |
| `--font-sans` | IBM Plex Sans Thai (self-hosted) | all text |
| `--radius`, `--radius-sm/md/lg` | Tailwind's | corners |
| `--motion-fast/base/page`, `--motion-ease` | 120 / 160 / 180 ms | overlays and page change (0 under reduced motion) |

`tungsten.brand_color` / `->brandColor()` set `--color-brand` inline per panel; leave both null to theme it in CSS
only. Sizes are rem only — the shell scales the rem base to 125%, so write `text-[0.6875rem]`, never `text-[11px]`.

## Things that will bite you

- **Inertia v3 layout callbacks get no `.props`.** A layout or toolbar reads page props with `usePage()`.
- **`form.transform()` doesn't chain** — call it, then `form.post()`.
- **Breadcrumbs use `find()`, never `findOrFail()`** — a missing record must give the page's own 404, not a crash in
  the trail.
- **Point routes at controllers or page classes, not closures** — `route:cache` must serialize them.
- **Bigint route parameters need `->whereNumber()`.**
- **Non-GET visits flush the prefetch cache** (`createTungstenApp` does it), so a list prefetched before a save is
  never shown stale.
- **Inertia DevTools is off** unless `INERTIA_DEVTOOLS_ENABLED` is set: in `local` it records every request with
  full props to disk (~100 ms a request, hundreds of MB in days). Set `tungsten.disable_inertia_devtools` to
  `false` to leave Inertia's default alone.

## Coming next

- Kit changes from the first production pages; a Laravel Boost guideline and a `tungsten-development` skill (list,
  view/edit, modal, policies, each mapped to its Filament equivalent).
- Global search, a database-notification bell, and optional login and profile pages.
- Later — CSV/Excel import wizard, table export, a documentation site.

## Testing

```bash
composer test          # Pest + Orchestra Testbench
composer analyse       # Larastan
cd tests/js-host && npm install && npm run build && npm run ssr   # build the kit through the alias, render it under Node
```

## Changelog

See the [Releases page](https://github.com/phattarachai/tungsten/releases).

## Licence

MIT. IBM Plex Sans Thai is under the SIL Open Font License (`resources/fonts/ibm-plex-sans-thai/OFL.txt`).

## ผู้พัฒนา

พัฒนาและดูแลโดย [บริษัท ภัทรชัย อาร์ทิซาน จำกัด](https://phattarachai.dev) (Phattarachai Artisan)
บริษัทที่ปรึกษาและพัฒนาเว็บ ที่เรียนรู้และแบ่งปันกับชุมชน Laravel
แพ็กเกจนี้แบ่งปันให้ชุมชนนำไปใช้และต่อยอดได้อย่างอิสระ

ดูแพ็กเกจอื่นของเราได้ที่ [phattarachai.dev/open-source](https://phattarachai.dev/open-source)
และติดต่อเราได้ที่ [phattarachai.dev](https://phattarachai.dev/#contact)
