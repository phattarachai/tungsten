# Tungsten

[![Latest Version on Packagist](https://img.shields.io/packagist/v/phattarachai/tungsten.svg?style=flat-square)](https://packagist.org/packages/phattarachai/tungsten)
[![Tests](https://img.shields.io/github/actions/workflow/status/phattarachai/tungsten/run-tests.yml?branch=main&label=tests&style=flat-square)](https://github.com/phattarachai/tungsten/actions/workflows/run-tests.yml?query=branch%3Amain)
[![Code Style](https://img.shields.io/github/actions/workflow/status/phattarachai/tungsten/fix-php-code-style-issues.yml?branch=main&label=code%20style&style=flat-square)](https://github.com/phattarachai/tungsten/actions/workflows/fix-php-code-style-issues.yml?query=branch%3Amain)
[![PHP Version](https://img.shields.io/packagist/dependency-v/phattarachai/tungsten/php?style=flat-square&label=php&logo=php&logoColor=white)](https://packagist.org/packages/phattarachai/tungsten)
![Laravel Version](https://img.shields.io/badge/laravel-12%20%7C%2013-FF2D20?style=flat-square&logo=laravel&logoColor=white)
[![Total Downloads](https://img.shields.io/packagist/dt/phattarachai/tungsten.svg?style=flat-square)](https://packagist.org/packages/phattarachai/tungsten)

An admin panel kernel and UI kit for Laravel, built on Inertia + React. It replaces a Filament admin with pages you
write by hand in JSX, from a dense, Thai-first component kit, with PHP helpers that do the repetitive parts.

- **Panels** with their own path, gate, sidebar nav, switcher, breadcrumbs and help, mounted by the package.
- **Pages** are small PHP classes (path, component, nav entry, props) plus a JSX file. No declarative resources.
- **Sets** group a menu's pages and endpoints in one class, so several people (or agents) add pages in parallel
  without touching the panel provider.
- **A kit** of ~45 React components: `DataTable`, `TableToolbar`, `Pagination`, filter `Dropdown`, `Combobox`,
  `FormField`, `FormDialog`, `ConfirmDialog`, `RecordLayout`, `GroupedNav`, `Aside`, Buddhist-era (พ.ศ.)
  `DatePicker` / `DateRangePicker`, `Timeline`, `Stepper`, `TreeTable` and the shell around them.
- **`TableQuery`**: a server-side list from the query string — whitelisted sort, search, filters, pagination.
- **Generators**: `make:tungsten-page Orders/Index --model=Order` writes the page class and its JSX.

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
            ->brandColor('#0d9488')              // accent; the rest is the steel theme
            ->middleware(['panel.enabled'])      // on top of config('tungsten.middleware') = ['web', 'auth']
            ->navigationGroups(['การขาย', 'ลูกค้า', 'ระบบ'])
            ->discoverSets(app_path('Panel/Sets'), 'App\\Panel\\Sets')
            ->navigationLinks([
                ['label' => 'นำเข้าคำสั่งซื้อ', 'url' => '/orders/import', 'group' => 'การขาย', 'legacy' => true],
            ]);
    }
}
```

Other options: `->ability()`, `->pages([...])`, `->sets([...])`, `->routes(fn () => ...)`, `->help(fn ($routeName) => url)`,
`->logoutUrl('logout' | url | closure | false)`, `->rail('#14262a')` (sidebar tint), `->color()` / `->icon()` /
`->short()` (switcher chip), `->business()`, `->replaces('filament')`, `->home(false)`.

Without a page at the panel root, Tungsten mounts a card index of the panel's nav there.

**The switcher** lists every panel the user may open. Add a row for something that isn't a Tungsten panel — the
Filament admin you are migrating from — in a provider's `register()` or `panel()`:

```php
app(PanelRegistry::class)->entry(id: 'filament', label: 'ระบบเดิม', url: '/', short: 'v1', color: '#7c2d12');
```

and `->replaces('filament')` on the new panel draws it as a chip on that row.

## Add a page

```bash
php artisan make:tungsten-page Orders/Index --model=Order --label=คำสั่งซื้อ
php artisan make:tungsten-page Orders/Show
```

writes `app/Panel/Pages/Orders/IndexPage.php` + `resources/js/pages/panel/orders/Index.jsx` (a `TableQuery` list with
search, sort and pagination) and `ShowPage` at `orders/{order}`. Paths follow resource naming: `Index` → `orders`,
`Create` → `orders/create`, `Show` → `orders/{order}`, `Edit` → `orders/{order}/edit`; `--path` overrides.

A page class:

```php
use Phattarachai\Tungsten\Page;
use Phattarachai\Tungsten\Table\TableQuery;

class IndexPage extends Page
{
    public function path(): string { return 'orders'; }                   // route admin.orders
    public function component(): string { return 'panel/orders/Index'; }  // resources/js/pages/panel/orders/Index.jsx
    public function navLabel(): string { return 'คำสั่งซื้อ'; }
    public function navGroup(): ?string { return 'การขาย'; }
    public function navIcon(): ?string { return 'shopping-cart'; }        // a lucide name, see "Icons"

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

The route key derives from the path (`orders/{order}` → `admin.orders.show`). Every route parameter is constrained
to a number by default (`wheres()`), so `/admin/orders/abc` is a 404 rather than a database error on a bigint key.
Other hooks: `ability()` (gate per page, also hides its nav entry), `navSort()`, `navBadge()`, `visible()`,
`showInNavigation()`, `breadcrumbs(Request)`, `route(Route)` and `endpoints()`.

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

A registered page class that doesn't exist is skipped (and reported), never fatal. Assert
`app(PanelRegistry::class)->missingClasses()` is empty in a test so a typo can't hide.

## Add a set

A set is one menu's pages, endpoints, links and help topics. With `->discoverSets(...)` a new set is a new file —
nobody edits the provider:

```php
namespace App\Panel\Sets;

use Phattarachai\Tungsten\PanelSet;

class OrdersSet extends PanelSet
{
    public static function pages(): array
    {
        return [IndexPage::class, ShowPage::class, EditPage::class];
    }

    public static function routes(): void   // inside the panel's prefix, middleware and `admin.` name prefix
    {
        Route::put('orders/{order}', [OrderController::class, 'update'])->name('orders.update')->whereNumber('order');
        Route::post('orders/{order}/cancel', CancelOrderController::class)->name('orders.cancel')->whereNumber('order');
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

Everything is exported from `@tungsten`. Open the **UI Kit** page to see each component in its states under your
panel's colours — add `Phattarachai\Tungsten\Pages\UiKitPage::class` to a panel's pages (outside production).

- **Shell**: `AppLayout` (`toolbar`, `flush`), sidebar with collapsible groups, topbar with breadcrumbs, the panel
  switcher, toasts, instant `title` tooltips, the `Aside` slot beside `main`, the handbook `HelpPanel`.
- **Lists**: `DataTable` (sortable, selection, row actions, groups with subtotals, sticky columns), `DataList`,
  `TreeTable`, `TableToolbar`, `Pagination`, `Pills`, `SearchInput`, `Dropdown`, `ColumnsMenu`, `SelectionBar`.
- **Forms**: `FormField` (inline label, `hint`, `info`, `error`), `Input`, `Select`, `Textarea`, `Combobox`
  (searchable, multiple), `Switch`, `DatePicker` / `DateTimePicker` / `DateRangePicker` (values stay ISO
  Gregorian; display is พ.ศ.), `FormDialog`, `ConfirmDialog`, `Dialog`.
- **Records**: `RecordLayout`, `PageHeader`, `GroupedNav`, `NavList`, `RecordPager`, `Section`, `SectionGrid`,
  `TabSection`, `DetailList`, `Timeline`, `Stepper`, `AuditPanel`, `LastEdited`.
- **Buttons**: `Button` (`solid · outline · ghost` × `neutral · brand · amber · blue · danger`), `IconButton`,
  `ActionMenu`, `RowActions`, `ButtonBar`, `ButtonGroup`, `SyncButton`, `Badge`.

### Icons

Nav icons are kebab-case lucide names resolved through a static registry, so the bundle holds only the icons in
use. The kit registers ~60 common ones; add yours in the entry:

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

The "steel" theme re-points Tailwind's `zinc-*` and `blue-*` ramps to cool steel greys under the panel's root, so
pages written with plain `zinc-*` utilities match the kit. The accent is `--color-brand` (set from
`tungsten.brand_color` or `->brandColor()`), with `brand-50/100/400/600/700` mixed from it. The font is IBM Plex Sans
Thai, self-hosted from the package. Sizes are rem only — the shell scales the rem base to 125%, so write
`text-[0.6875rem]`, never `text-[11px]`.

## Things that will bite you

- **Inertia v3 layout callbacks get no `.props`.** A layout or toolbar reads page props with `usePage()`.
- **`form.transform()` doesn't chain** — call it, then `form.post()`.
- **Breadcrumbs use `find()`, never `findOrFail()`** — they also render while an error page is built.
- **Point extra routes at controllers, not closures** — `route:cache` must serialize them. Page routes already use
  `PageController`.
- **Non-GET visits flush the prefetch cache** (`createTungstenApp` does it), so a list prefetched before a save is
  never shown stale.
- **Inertia DevTools is off** unless `INERTIA_DEVTOOLS_ENABLED` is set: in `local` it records every request with
  full props to disk (~100 ms a request, hundreds of MB in days). Set `tungsten.disable_inertia_devtools` to
  `false` to leave Inertia's default alone.

## Coming next

- **v0.2** — kit changes from the first production pages; a Laravel Boost guideline and a `tungsten-development`
  skill (list, view/edit, modal, policies, each mapped to its Filament equivalent).
- **v0.3** — global search, a database-notification bell, login and profile pages.
- Later — CSV/Excel import wizard, table export, a documentation site.

## Testing

```bash
composer test          # Pest + Orchestra Testbench
composer analyse       # Larastan
cd tests/js-host && npm install && npm run build   # builds the kit through the @tungsten alias
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
