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
            ->brand('My Shop', tag: 'v2', logo: 'images/brand-mark.svg')   // sidebar head + login: name, tag, mark
            ->brandColor('#0d9488')              // accent; or theme it in CSS, see "Theme"
            ->middleware(['panel.enabled'])      // on top of config('tungsten.middleware')
            ->navigationGroups(['การขาย', 'ลูกค้า', 'ระบบ'])
            ->discoverSets(app_path('Panel/Sets'), 'App\\Panel\\Sets');
    }
}
```

Other options: `->ability('…' | null)`, `->sets([...])`, `->routes(fn () => …)`, `->navigationLinks([...])`,
`->help(fn ($routeName) => $url)`, `->login(...)` (see Sign-in), `->logoutUrl('logout' | url | closure | false)`, `->rail('#14262a')` (sidebar tint),
`->filterLayout('bar' | 'menu')` (how `<Filters>` draws), `->layout(['sheet' => true])` (panel-wide `AppLayout` defaults; a route's `->layout()` overrides them key by key),
`->color()` / `->icon()` / `->short()` (switcher chip), `->business()`, `->replaces('filament')`.

**The brand mark** on the sidebar head and the login page is a chip in the panel's `->color()`, holding (first that is
set) `brand(logo:)` — a single-colour SVG drawn white as a CSS mask; a public path goes through `asset()`, a full URL
is kept — then `brand(icon:)`, then the panel's `short` letters. The switcher's rows keep their own chips. The tab
icon is `config('tungsten.favicon')`: one path, or several for the browser to choose from
(`['favicon.png', 'images/brand-mark.svg']`, SVG last), plus `tungsten.apple_touch_icon`.

**The environment** shows as a small "• UAT" line under the brand name (sidebar head and login page), as a tone
`Badge` in the compact topbar switcher when the rail is closed, and as a "UAT · " prefix on the tab title. Production
shows nothing. The kit's defaults are production → nothing, `local` → Local / `active`, `staging` → Staging / `done`,
`uat` → UAT / `todo`; any other environment shows its own name in `draft`. Relabel, retone or hide one in
`config('tungsten.environments')`, which goes over the defaults:

```php
'environments' => ['staging' => ['label' => 'Dev', 'tone' => 'done'], 'qa' => null],
```

It's shared as `panel.env` (`{label, tone}` or null) next to `panel.environment`, the raw name. Keep `APP_NAME` free of
the environment: the title is `"{env} · {page} — {APP_NAME}"`.

**The switcher** lists every panel the user may open. Add a row for something that isn't a Tungsten panel — the
Filament admin you are migrating from — and `->replaces('filament')` on the new panel draws it as a chip on that row:

```php
app(PanelRegistry::class)->entry(id: 'filament', label: 'ระบบเดิม', url: '/', short: 'v1', color: '#7c2d12');
```

An entry with `business: false` lists after the tool panels; every row is a plain link that opens in the same tab.
**Footer links** are app-wide shortcuts at the foot of every panel's switcher menu (the store front, a BI tool):
two to a row, each with a 16px image or icon and ↗, always opening a new tab, filtered by `ability` like entries.
`entry()` and `link()` chain; register them in a provider's `boot()`:

```php
app(PanelRegistry::class)
    ->entry(id: 'cms', label: 'CMS เว็บไซต์', url: 'https://shop.example.com/admin', description: 'shop.example.com/admin', icon: 'newspaper', color: '#111111', business: false)
    ->link('เว็บไซต์', 'https://shop.example.com/', image: 'images/store-favicon.png')
    ->link('Metabase', 'https://metabase.example.com', icon: 'gauge', ability: 'viewReports');
```

They're shared as `panel_links` (`{label, url, icon, image}`; a public path becomes a full URL).

## Sign-in (optional)

A panel can have its own login page, in the panel's theme, or leave sign-in to the app (Breeze, SSO, Filament's):
without `->login()` nothing changes and guests go wherever `auth` sends them.

```php
return $panel
    ->path('admin')
    ->login(
        guard: 'web',                                     // null: the default guard
        labels: ['title' => 'เข้าสู่ระบบหลังร้าน'],        // over config('tungsten.login.labels')
        forgotPasswordUrl: 'password.request',            // a route name or URL; null hides the link
        authorize: fn (User $user, Panel $panel) => $user->role === 'system' ? 'บัญชีระบบเข้าหน้านี้ไม่ได้' : true,
    );
```

- Routes: `GET`/`POST {path}/login` (`admin.login`, `admin.login.attempt`) and `POST {path}/logout` (`admin.logout`),
  behind `config('tungsten.login.middleware')` (`['web']`) only, not the panel's auth or gate.
- Guests on the panel's routes go to its login: the panel's `auth` becomes `AuthenticatePanel` (the same check,
  with this redirect), and is added if `tungsten.middleware` has none. After signing in they return to the URL they
  asked for, or the panel home.
- It checks email + password against the guard's user provider, with "remember me" and a throttle (5 tries a
  minute per email and IP). There is no registration.
- After the password, the user must pass the panel's ability (`accessAdmin`), then `authorize`: `true`/`null` lets
  them in, `false` shows the `denied` label, a string is shown as the message.
- The user menu's sign-out points at `{path}/logout` unless `->logoutUrl()` says otherwise.
- Every word on the page is a label in `config('tungsten.login.labels')` (Thai by default): `title`, `intro`,
  `email`, `password`, `remember`, `submit`, `forgot`, `failed`, `denied`, `throttled` (`:seconds`, `:minutes`).

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
| `->layout([...])` | defaults for `AppLayout` (`sheet`, `flush`, `sidebar`, `topbar`, `className`, `mainClassName`), merged over the panel's `->layout()` and shared as the `layout` prop. |

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
builder for an export. In JSX, `useTableQuery()` gives `setSearch`, `setSort`, `setPage`, `setPerPage`, `setFilter`,
`setFilters` and `clear`, each a `preserveState` visit that resets to page 1 (except `setPage`).

**Filters: one definition, two layouts.** Describe a list's filters once and `<Filters>` draws them either as a
bar above the table with every filter shown (`bar`), or as a dropdown with a chip per active filter (`menu`, a toolbar
that stays one line). A project picks its default in `config('tungsten.filter_layout')`, a panel with
`->filterLayout('menu')`, and a page with `<Filters layout="menu">`.

The bar has the project-wide list shape: **row 1** the date presets (and the custom range when picked); **row 2** the
search first, then the other filters, then a clear-all icon while anything is set (it also empties the search);
filters with `row: 'below'` make a third row.

```jsx
const filters = [
    { key: 'date', label: 'วันที่สั่ง', type: 'dates', options: [{ value: 'today', label: 'วันนี้' }, { value: '7d', label: '7 วัน' }] },
    { key: 'type', label: 'ประเภท', type: 'select', multiple: true, options: types },
    { key: 'channel', label: 'ช่องทาง', type: 'select', options: channels },
    tab === 'shipping' && { key: 'shipping', label: 'สถานะการจัดส่ง', type: 'buttons', default: 'pending', options: shippingStates },
]

<Filters
    flush
    filters={filters}
    values={orders.filters}
    onChange={query.setFilters}
    search={{ value: orders.search, placeholder: 'ค้นหาเลขที่ ชื่อ เบอร์โทร' }}
/>
<DataTable flush columns={columns} rows={orders.rows} sort={orders.sort} onSort={query.setSort} />
<Pagination flush paginator={orders.pagination} onPage={query.setPage} onPerPage={query.setPerPage} />
```

| Field | Meaning |
|---|---|
| `type` | `select` (`Combobox`, `multiple` for an array), `buttons` (segmented), `pills`, `toggle` (`1` or null), `dates`, `custom` (`render({ value, values, onChange, change, size })`) |
| `dates` | presets from `options`, with ทั้งหมด first and วันที่กำหนดเอง last; the custom one opens a range picker writing the `from` / `to` keys (rename with `from:` / `to:`). A preset clears the range and the range clears the preset. Goes to row 1. |
| `default` | the value that counts as "not filtered" (no chip, no clear) |
| `row` | `'top'` (row 1), `'below'` (row 3); row 2 when unset (row 1 for `dates`) |
| `chip(value, values)` | the chip's label, instead of `label: option` |

`search` is `{ value, placeholder?, onSearch?, key? }`: a `SearchInput` leading row 2 that writes `search` through
`onChange` and that clear-all empties. A node works too, drawn as given. `start` leads row 1 (tabs, say). In the bar,
`buttons` and `pills` filters outside row 1 show their label. `onChange` gets `{ key: value }` changes (null
clears), which is what `useTableQuery().setFilters` takes. The parts are exported for a layout of your own:
`FilterBar` (`top`, `end`, `below`, + `FilterField`), `FilterMenu`, `FilterChip`.

`onPerPage` adds a 25 / 50 / 100 picker (`perPageOptions` to change it); the server allows the same values with
`->perPage(25, [25, 50, 100])`.

## The kit

Everything is exported from `@tungsten`. To see each component in its states under your panel's colours, route the
UI Kit page (outside production):

```php
Route::get('ui-kit', UiKitPage::class)->name('ui-kit')->nav('UI Kit', icon: 'palette', sort: 1000);
Route::post('ui-kit/toast', UiKitToastController::class)->name('ui-kit.toast');
```

- **Shell**: `AppLayout` (`toolbar`, `sheet`, `flush`, `sidebar={false}`, `topbar={false}`, `className`, `mainClassName`), and
  its parts for a layout of your own: `Sidebar`, `Topbar`, `PanelSwitcher`, `FlashToast`, `TooltipLayer`, `Aside`.
- **Lists**: `DataTable` (sortable, selection, row actions, groups with subtotals, sticky columns), `DataList`,
  `TreeTable`, `Filters` (bar or menu), `FilterBar` / `FilterField`, `FilterMenu`, `FilterChip`, `TableToolbar`, `Pagination` (optional per-page picker), `Pills` (scrolls
  sideways when narrow), `SearchInput`, `Dropdown`, `ColumnsMenu`, `SelectionBar`, `AvatarStack` (the first `max`,
  then +N with the rest in its tooltip), `Thumb` (a 2rem rounded image, grey placeholder without one; `zoom`
  opens it full screen).
  `DataTable`, `FilterBar`, `TableToolbar` and `Pagination` take `flush` to drop their frame and side padding, for a
  table on a sheet or a bare page. A `DataTable` column takes `valign: 'top'` for multi-line cells (or the table its
  own `valign`), and `plainLinks` makes `rowHref` render a plain `<a>` for rows that open non-Inertia pages.
- **Forms**: `FormField` (inline label, `hint`, `info`, `error`), `Input`, `Select`, `Textarea`, `Combobox`
  (searchable, multiple; `size="sm"` + `label` for a filter bar; an option's `avatar` — a URL, or null for the
  initial — draws a small round photo before its label), `ButtonGroup` (`size="sm"` for toolbar presets), `RadioGroup` (options `{ value, label, description?, disabled? }` as
  native radios — arrow keys move within the group; `layout` `list` / `cards` / `inline`; `invalid` for the red frame),
  `Checkbox` (`label`, `hint`, `error`, `indeterminate`; `onChange` gets the checked state), `Switch`, `DatePicker` / `DateTimePicker` / `DateRangePicker` (values stay ISO
  Gregorian; display is พ.ศ.), `FormDialog`, `ConfirmDialog`, `Dialog`.
  Fields are full width by default; a width in `className` (`w-64`, `md:w-48`, `size-*`, `basis-*`) replaces it, while
  `max-w-*` / `min-w-*` only bound it (`Input`, `Textarea`, `Select`, `Combobox`, the date pickers).
- **Records**: `RecordLayout`, `PageHeader`, `GroupedNav`, `NavList`, `RecordPager`, `Section`, `SectionGrid`,
  `TabSection`, `DetailList`, `Timeline`, `Stepper`, `AuditPanel`, `LastEdited`.
- **Buttons**: `Button` (`solid · outline · ghost` × `neutral · brand · amber · blue · danger`), `IconButton`,
  `ActionMenu`, `RowActions`, `ButtonBar`, `ButtonGroup`, `SyncButton`, `Badge` (colour tones and status tones, below).

Components take `className` where it makes sense; nothing stops a page from using plain elements beside them.

### Record pages

A record (detail) page is one sheet: no Section inside a Section, plain-text headings, one hairline between blocks,
label–value facts with no boxes, and widths by container (`@container`, `@2xl:`), never the viewport, so an open
Aside doesn't squeeze it.

```jsx
<StatsStrip stats={[
    { label: 'คำสั่งซื้อทั้งหมด', value: '128', hint: 'ตั้งแต่ ม.ค. 68' },
    { label: 'ค้างชำระ', value: '2', tone: 'todo', href: route('admin.orders', { customer: id }) },
]} />
<div className="@container">
    <Heading actions={<IconButton icon={FilePen} label="แก้ไขข้อมูลลูกค้า" onClick={edit} />}>ข้อมูลลูกค้า</Heading>
    <div className="grid gap-4 @2xl:grid-cols-2">
        <Facts rows={[{ label: 'ชื่อ', value: name }, phone && { label: 'เบอร์โทร', value: phone }]} />
        <Facts rows={[{ label: 'อีเมล', value: email }]} labelWidth="6rem" />
    </div>
    <Rule />
    …
</div>
```

- `StatsStrip`: a row of figures with hairlines between them, 2 / 3 (`@2xl`) / 6 (`@5xl`) columns. A stat is
  `{ label, value, hint?, tone?, href? }`, where `tone` is a status tone for the value and `href` makes the cell a link.
- `Heading` takes `actions` at its right (icon buttons, a ⋯ ActionMenu). `Rule` is the hairline.
- `Facts` skips falsy rows and shows a grey dash for an empty value. (`DetailList` is the boxed version, for inside a
  Section.)

### JSON calls

For what isn't an Inertia visit (a dialog's lookup, a quick save), call the app with Laravel's XSRF cookie:

```js
const { ok, status, body, errors, message } = await sendJson(url, 'PATCH', { phone })   // never rejects on HTTP errors
const customers = await getJson(searchUrl, { q })                                        // body, or throws
const created = await postJson(storeUrl, data)                                          // body, or throws
```

`errors` holds a 422's first message per field, ready for `FormField error`; the thrown error carries `message`,
`status` and `errors`. A GET's data goes in the query string.

### Lightbox

Every image can open full screen. AppLayout provides one shared viewer; outside it, `Zoomable` brings its own.

```jsx
<Thumb src={product.thumb} full={product.image} alt={product.name} zoom />            // one image
<Thumb src={slip.url} alt="สลิป" zoom={{ images: slips, index }} />                    // step through a group
<Avatar person={user} zoom />
<Zoomable images={[{ src, full, alt }]} index={0}><img … /></Zoomable>                // any markup
const open = useLightbox(); open(images, index)                                        // from code
```

`Avatar` (and a `Combobox` option's avatar) falls back to the initial when the photo fails to load (a dead CDN or
LINE link). Images are `{ src, full?, alt? }` (`full` is the large file when `src` is a thumbnail). The viewer shows the image with
its caption and "n / N"; ← / → and the side buttons step through the group; Escape, the × or a click outside the
image closes it. It traps focus (focus starts on ×, goes back to the thumbnail on close) and locks the page scroll.
Nothing renders on the server.

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

A light chrome with the content on one white sheet — grey rail and topbar, no lines, a white chip for the active
item — is tokens plus `Panel::layout(['sheet' => true])`:

```css
@theme {
    --color-rail: #f5f5f4;
    --color-rail-ink: #3f3e3d;
    --color-rail-ink-active: #000000;
    --color-rail-muted: #a4a4a4;
    --color-rail-hover: #ebeae8;
    --color-rail-active: #ffffff;
    --color-rail-line: transparent;
    --color-topbar: #f5f5f4;
    --color-topbar-line: transparent;
    --color-topbar-hover: #ebeae8;
}
```

An app whose `--font-sans` is another font imports `resources/css/kit.css` instead of `tungsten.css`: the same theme
without the IBM Plex Sans Thai `@font-face` rules, so the build doesn't ship the font files.

| Token | Default | Used for |
|---|---|---|
| `--color-zinc-50…950` | steel greys | every grey in the kit and in pages written with `zinc-*` |
| `--color-blue-50…950` | muted steel blue | the info tone |
| `--color-brand` (+ `-50/100/400/600/700` mixed from it) | `#ba1a1a` | the accent |
| `--color-rail`, `--color-rail-ink`, `--color-rail-muted` | graphite | the sidebar |
| `--color-rail-ink-active` | `#ffffff` | the active and hovered nav item's text, the switcher's label |
| `--color-rail-hover`, `--color-rail-active`, `--color-rail-line` | mixed from the rail toward its ink | nav hover, the active item, the line under the switcher |
| `--color-topbar`, `--color-topbar-line`, `--color-topbar-hover` | white, `zinc-200`, `zinc-100` | the topbar, its bottom line, its buttons' hover |
| `--color-sheet`, `--color-sheet-line` | white, `zinc-200` | `AppLayout sheet`'s surface and border |
| `--color-tone-<name>`, `--color-tone-<name>-ink` | soft tints, AA ink | the status tones below |

**Status tones.** Name a status by what it means, not by colour: `<Badge tone="todo">ที่ต้องจัดส่ง</Badge>`, and a
`Pills` option's `tone` colours its count while that tab isn't selected. Each tone is a fill and an ink token; redefine
them in `@theme` to restyle every status at once.

| Tone | Means |
|---|---|
| `draft` | not started |
| `waiting` | waiting on someone outside (a customer, a supplier) |
| `todo` | our turn: someone here has to act |
| `active` | in progress |
| `done` | finished |
| `canceled` | canceled or expired |
| `failed` | an error to fix (bold, with a warning icon) |

The colour tones (`zinc`, `brand`, `green`, `amber`, `red`, `blue`, and `success` / `warning` / `danger` / `gray` /
`info`) stay for anything that isn't a status.
| `--font-sans` | IBM Plex Sans Thai (self-hosted) | all text |
| `--radius`, `--radius-sm/md/lg` | Tailwind's | corners |
| `--motion-fast/base/page`, `--motion-ease` | 120 / 160 / 180 ms | overlays and page change (0 under reduced motion) |

`tungsten.brand_color` / `->brandColor()` set `--color-brand` inline per panel; leave both null to theme it in CSS
only. Sizes are rem only — the shell scales the rem base to 125%, so write `text-[0.6875rem]`, never `text-[11px]`.

## Things that will bite you

- **Inertia v3 layout callbacks get no `.props`.** A layout or toolbar reads page props with `usePage()`.
- **A page prop can't reuse a shared prop's name.** Inertia lets page props win, so a page returning `panels` (or
  `panel`, `panel_links`, `nav`, `auth`, `flash`, `errors`) would replace the panel's own and crash the shell. Tungsten checks every
  panel response: it throws `ReservedPropName` while `app.debug` is on and reports it otherwise. Rename the prop.
  `breadcrumbs` and `layout` are meant to be overridden by a page.
- **`form.transform()` doesn't chain** — call it, then `form.post()`.
- **Breadcrumbs use `find()`, never `findOrFail()`** — a missing record must give the page's own 404, not a crash in
  the trail.
- **Point routes at controllers or page classes, not closures** — `route:cache` must serialize them.
- **Bigint route parameters need `->whereNumber()`.**
- **Non-GET visits flush the prefetch cache** (`createTungstenApp` does it), so a list prefetched before a save is
  never shown stale.
- **Another Inertia entry must not glob the panel pages.** If the app has its own Inertia root whose resolver eagerly
  globs `./pages/**`, exclude the panel: `import.meta.glob(['./pages/**/*.jsx', '!./pages/panel/**'], { eager: true })`.
  Otherwise Rollup bundles the panel pages into that entry's chunk, and the panel's `@vite(page)` throws "Unable to
  locate file in Vite manifest".
- **Inertia DevTools is off** unless `INERTIA_DEVTOOLS_ENABLED` is set: in `local` it records every request with
  full props to disk (~100 ms a request, hundreds of MB in days). Set `tungsten.disable_inertia_devtools` to
  `false` to leave Inertia's default alone.

## Coming next

- Kit changes from the first production pages; a Laravel Boost guideline and a `tungsten-development` skill (list,
  view/edit, modal, policies, each mapped to its Filament equivalent).
- Global search, a database-notification bell, and a profile page.
- Later — CSV/Excel import wizard, table export, a documentation site.

## Testing

```bash
composer test          # Pest + Orchestra Testbench
composer analyse       # Larastan
cd tests/js-host && npm install && npm run build && npm run ssr && npm run unit   # build through the alias, render under Node, check helpers + components (jsdom)
```

In a host app, a route that renders one of the kit's own pages (`HomePage`, `UiKitPage`) has no page file in the
host's `resources/js/pages`, so assert its component without the existence check:
`assertInertia(fn ($p) => $p->component('tungsten::Home', shouldExist: false))`.

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
