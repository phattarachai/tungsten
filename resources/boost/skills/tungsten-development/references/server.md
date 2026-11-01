# Tungsten server side

## Panel

One `PanelProvider` per panel, listed in `bootstrap/providers.php`:

```php
class AdminPanelProvider extends \Phattarachai\Tungsten\PanelProvider
{
    // id() defaults to 'admin': routes are named admin.*, the default gate is accessAdmin
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->path('admin')
            ->label('ร้านค้า')
            ->brand('ร้านค้า', tag: 'v2', logo: 'images/brand-mark.svg')   // sidebar head + login mark
            ->color('#d42a2f')                                            // switcher chip
            ->ability('accessPanel')                                      // null: no gate
            ->middleware([EnsureFeatureEnabled::class])                    // after config('tungsten.middleware')
            ->navigationGroups(['การขาย', 'ลูกค้า', 'ระบบ'])
            ->discoverSets(app_path('Panel/Sets'), 'App\\Panel\\Sets')
            ->layout(['sheet' => true])                                   // AppLayout defaults for every page
            ->filterLayout('bar')                                          // or 'menu'
            ->login();                                                     // optional own sign-in page
    }
}
```

`->login(guard:, labels:, forgotPasswordUrl:, authorize: fn ($user, $panel) => true|false|'message')` adds
`{path}/login` and `{path}/logout`; guests on the panel go there. Without it, the app's own auth applies.

Switcher rows for things that aren't panels and footer links go in a provider's `boot()`:

```php
app(PanelRegistry::class)
    ->entry(id: 'cms', label: 'CMS', url: 'https://example.com/admin', icon: 'newspaper', color: '#111111', business: false)
    ->link('เว็บไซต์', 'https://example.com/', image: 'images/favicon.png')
    ->link('Metabase', 'https://metabase.example.com', icon: 'gauge', ability: 'viewReports');
```

## Sets and routes

A set is one area of the panel (orders, customers). One file, discovered by `discoverSets()`:

```php
class OrdersSet extends \Phattarachai\Tungsten\PanelSet
{
    public static function routes(): void   // inside the panel's prefix, middleware, gate and name prefix
    {
        Route::get('orders', IndexPage::class)->name('orders')
            ->nav('คำสั่งซื้อ', icon: 'shopping-cart', group: 'การขาย', badge: PendingOrders::class);
        Route::get('orders/{order}', ShowPage::class)->name('orders.show')->whereNumber('order');
        Route::get('orders/{order}/edit', EditPage::class)->name('orders.edit')->whereNumber('order')
            ->breadcrumb('แก้ไข')->width('4xl');
        Route::put('orders/{order}', [OrderController::class, 'update'])->name('orders.update')->whereNumber('order');
        Route::post('orders/reorder', ReorderOrdersController::class)->name('orders.reorder');
    }

    public static function links(): array   // nav entries for pages still in the old admin
    {
        return [['label' => 'นำเข้าคำสั่งซื้อ', 'url' => '/orders/import', 'group' => 'การขาย', 'legacy' => true]];
    }

    public static function helpTopics(): array   // route-name pattern => handbook URL for the topbar ?
    {
        return ['admin.orders*' => '/handbook/orders'];
    }
}
```

| Route macro | Does |
|---|---|
| `->nav($label, icon:, group:, sort:, badge:, ability:)` | a sidebar entry (parameterless GET routes); `badge` is a string or an invokable class |
| `->breadcrumb($label, parent:)` | the trail's last crumb; the parent nav route is inferred from the name (`admin.orders.edit` → `admin.orders`) |
| `->breadcrumbs([...])` | a fixed trail |
| `->help($url)` | the topbar `?` for this route |
| `->width('4xl')` | caps the content width inside the sheet (`sm` … `7xl`, `full`) |
| `->layout([...])` | AppLayout defaults: `sheet`, `flush`, `width`, `sidebar`, `topbar`, `className`, `mainClassName` |

A route's own `can:x` middleware hides its nav entry from users who fail `x`. Point routes at controllers or page
classes, never closures (`route:cache`).

## Page classes

`php artisan make:tungsten-page Orders/Index --model=Order --label=คำสั่งซื้อ` writes the page class and its JSX, and
prints the route line to paste into the set. A page is an invokable controller:

```php
class ShowPage extends \Phattarachai\Tungsten\Page
{
    public function component(): string
    {
        return 'panel/orders/Show';
    }

    public function props(Request $request): array
    {
        $order = Order::query()->with(['customer', 'lines'])->findOrFail($request->route('order'));

        return ['order' => OrderView::from($order)];   // rows and values, never markup
    }

    public function breadcrumbs(Request $request): ?array
    {
        return Tungsten::breadcrumbs(Order::query()->find($request->route('order'))?->number);   // find(), never findOrFail()
    }
}
```

A plain controller with `Inertia::render('panel/…', [...])` works the same; pass a `breadcrumbs` prop to set the trail.

## Lists: TableQuery

```php
'orders' => TableQuery::for(Order::query()->with('customer'), $request)
    ->sorts(['number', 'created_at', 'total', 'customer' => '(select name from customers where customers.id = orders.customer_id)'])
    ->defaultSort('created_at', 'desc')
    ->search(['number', 'customer.name', 'customer.phone'])          // operator: 'ilike' on Postgres
    ->filter('status', in: ['pending', 'paid', 'cancelled'])
    ->filter('type', multiple: true)
    ->filter('date', fn ($query, $preset) => $query->where('created_at', '>=', DatePreset::start($preset)))
    ->filter('from', fn ($query, $day) => $query->whereDate('created_at', '>=', $day))
    ->filter('to', fn ($query, $day) => $query->whereDate('created_at', '<=', $day))
    ->perPage(25, [25, 50, 100])
    ->paginate(fn (Order $order) => OrderRow::from($order)),
```

The prop is `{ rows, pagination, search, sort, filters, per_page }`; `->query()` gives the filtered, sorted builder
for an export. Only whitelisted sort keys and filter values reach the query; blanks sort last; LIKE input is escaped.

Format every date for the user server-side (Thai), and send ISO too when the client shows relative times. Send each
status as `{ label, tone }`.

## Errors and flash

`Tungsten::handleExceptions($exceptions)` in `bootstrap/app.php` renders 403/404/419/500/503 for panel paths as the
kit's error page. Flash a toast with `session()->flash('flash', ['message' => 'บันทึกแล้ว', 'tone' => 'success'])`
(tones `success`, `info`, `warning`, `error`).

## Tests (Pest)

```php
it('lists orders for staff and filters by status', function () {
    $this->actingAs(staff())
        ->get('/admin/orders?status=paid')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('panel/orders/Index')->has('orders.rows', 2)->where('orders.filters.status', 'paid'));
});

it('forbids users without the panel ability', fn () => $this->actingAs(customer())->get('/admin/orders')->assertForbidden());
```

A kit page (`tungsten::Home`, `tungsten::UiKit`) has no file in the app: assert it with
`->component('tungsten::Home', shouldExist: false)`. Add `expect(app(PanelRegistry::class)->missingClasses())->toBe([])`
once, so a set that's listed but missing fails a test instead of being skipped quietly.
