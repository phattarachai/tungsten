<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Http\Middleware\AuthenticatePanel;
use Phattarachai\Tungsten\Http\Middleware\HandleTungstenRequests;
use Phattarachai\Tungsten\Pages\HomePage;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

it('mounts set routes and route-file routes under the panel path with the {id}. route name', function (): void {
    expect(route('admin.dashboard'))->toEndWith('/admin')
        ->and(route('admin.orders'))->toEndWith('/admin/orders')
        ->and(route('admin.orders.show', 5))->toEndWith('/admin/orders/5')
        ->and(route('admin.orders.edit', 5))->toEndWith('/admin/orders/5/edit')
        ->and(route('admin.reports.sales'))->toEndWith('/admin/reports/sales')
        ->and(route('admin.ui-kit'))->toEndWith('/admin/ui-kit')
        ->and(route('admin.orders.ship', 5))->toEndWith('/admin/orders/5/ship')
        ->and(route('tools.dashboard'))->toEndWith('/tools');
});

it('generates no route from a page class: only declared routes (and ->login()\'s) exist', function (): void {
    $names = collect(app('router')->getRoutes()->getRoutes())->map->getName()->filter(fn (?string $name): bool => str_starts_with((string) $name, 'admin.'))->sort()->values()->all();

    expect($names)->toBe(['admin.clashing-props', 'admin.dashboard', 'admin.login', 'admin.login.attempt', 'admin.logout', 'admin.orders', 'admin.orders.edit', 'admin.orders.ship', 'admin.orders.show', 'admin.reports.sales', 'admin.ui-kit', 'admin.ui-kit.toast']);
});

it('runs every panel route behind the configured middleware, the gate and the panel middleware', function (): void {
    expect(app('router')->getRoutes()->getByName('admin.orders')->gatherMiddleware())
        ->toBe(['web', AuthenticatePanel::class, 'can:accessAdmin', HandleTungstenRequests::class]);

    expect(app('router')->getRoutes()->getByName('tools.dashboard')->gatherMiddleware())
        ->toBe(['web', 'auth', 'can:accessTools', HandleTungstenRequests::class]);
});

it('sends a guest to the app\'s login route when the panel has no login of its own', function (): void {
    $this->get('/tools')->assertRedirect('/login');
});

it('refuses a user who fails the panel ability', function (): void {
    $this->actingAs($this->admin(500))->get('/admin/orders')->assertForbidden();
});

it('honours a route\'s own can: middleware', function (): void {
    $this->actingAs($this->admin(2))->get('/admin/reports/sales')->assertForbidden();
    $this->actingAs($this->admin(1))->get('/admin/reports/sales')->assertOk();
});

it('renders a page controller with its component, props and the shared panel props', function (): void {
    Order::query()->create(['number' => 'SO-1', 'status' => 'new']);

    $this->actingAs($this->admin())
        ->get('/admin/orders')
        ->assertOk()
        ->assertViewIs('tungsten::app')
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('panel/orders/Index')
            ->where('orders.rows.0.number', 'SO-1')
            ->where('auth.user.name', 'Admin 1')
            ->where('auth.logoutUrl', url('/admin/logout'))
            ->where('panel.id', 'admin')
            ->where('panel.label', 'ร้านค้า')
            ->where('panel.help', '/help/orders')
            ->where('panel.home', url('/admin'))
            ->where('breadcrumbs', [['label' => 'การขาย'], ['label' => 'คำสั่งซื้อ']])
            ->where('flash', ['message' => null, 'status' => null, 'id' => null])
            ->where('layout', null)
            ->has('nav')
            ->has('panels'));
});

it('treats a plain controller route the same, with its breadcrumb and layout metadata', function (): void {
    $order = Order::query()->create(['number' => 'SO-3', 'status' => 'new']);

    $this->actingAs($this->admin())
        ->get("/admin/orders/{$order->id}/edit")
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('panel/orders/Edit')
            ->where('breadcrumbs', [['label' => 'การขาย'], ['label' => 'คำสั่งซื้อ', 'url' => url('/admin/orders')], ['label' => 'แก้ไข']])
            ->where('layout', ['flush' => true])
            ->where('nav.1.items.0.active', true));
});

it('lets a page replace the breadcrumbs, ending the parent trail in a record name', function (): void {
    $order = Order::query()->create(['number' => 'SO-9', 'status' => 'paid']);

    $this->actingAs($this->admin())
        ->get("/admin/orders/{$order->id}")
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('panel/orders/Show')
            ->where('breadcrumbs', [['label' => 'การขาย'], ['label' => 'คำสั่งซื้อ', 'url' => url('/admin/orders')], ['label' => 'SO-9']]));
});

it('shares the brand with its logo as a URL: a public path through asset(), a full URL kept', function (): void {
    $this->actingAs($this->admin())
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page->where('panel.brand', ['label' => 'ร้านค้า', 'icon' => null, 'tag' => 'v2', 'logo' => asset('images/brand-mark.svg')]));

    $this->actingAs($this->admin())
        ->get('/tools')
        ->assertInertia(fn (Assert $page): Assert => $page->where('panel.brand.logo', 'https://cdn.example.com/mark.svg'));
});

it('shares the switcher footer links, filtered by ability, with public paths made absolute', function (): void {
    $store = ['label' => 'เว็บไซต์', 'url' => 'https://shop.example.com/', 'icon' => null, 'image' => asset('images/store.png')];
    $metabase = ['label' => 'Metabase', 'url' => 'https://metabase.example.com', 'icon' => 'gauge', 'image' => null];

    $this->actingAs($this->admin(1))
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page->where('panel_links', [$store, $metabase]));

    $this->actingAs($this->admin(2))
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page->where('panel_links', [$store]));
});

it('links a favicon pair and an apple touch icon', function (): void {
    config(['tungsten.favicon' => ['favicon.png', 'images/brand-mark.svg'], 'tungsten.apple_touch_icon' => 'apple-touch-icon.png']);

    $this->actingAs($this->admin())
        ->get('/admin/orders')
        ->assertSeeInOrder([
            'rel="icon" href="'.asset('favicon.png').'"', 'type="image/png"',
            'rel="icon" href="'.asset('images/brand-mark.svg').'"', 'type="image/svg+xml"',
            'rel="apple-touch-icon" href="'.asset('apple-touch-icon.png').'"',
        ], false);
});

it('gives each response that carries a flash a new id, so the same message twice shows twice', function (): void {
    $ids = collect(range(1, 2))->map(function (): string {
        $id = null;

        session()->flash('flash', ['message' => 'แต้มคงเหลือไม่เพียงพอ', 'tone' => 'error']);

        $this->actingAs($this->admin())
            ->get('/admin/orders')
            ->assertInertia(function (Assert $page) use (&$id): Assert {
                $id = $page->toArray()['props']['flash']['id'];

                return $page->where('flash.message.message', 'แต้มคงเหลือไม่เพียงพอ');
            });

        return (string) $id;
    });

    expect($ids->filter()->unique())->toHaveCount(2);

    session()->forget('flash');

    $this->actingAs($this->admin())->get('/admin/orders')->assertInertia(fn (Assert $page): Assert => $page->where('flash.id', null));
});

it('puts the panel brand colour on the root element', function (): void {
    $this->actingAs($this->admin())
        ->get('/admin/orders')
        ->assertSee('style="--color-brand: #0d9488"', false);
});

it('leaves the brand colour to the stylesheet when none is configured', function (): void {
    config(['tungsten.brand_color' => null]);

    $this->actingAs($this->admin(1))->get('/tools')->assertOk()->assertDontSee('--color-brand', false);
});

it('builds the nav from route metadata in group order, filtered by can: middleware, with badges and links', function (): void {
    Order::query()->create(['number' => 'SO-5', 'status' => 'new']);
    Order::query()->create(['number' => 'SO-6', 'status' => 'new']);

    $this->actingAs($this->admin(2))
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('nav.0.group', null)
            ->where('nav.0.items.0.label', 'หน้าหลัก')
            ->where('nav.0.items.1.label', 'UI Kit')
            ->where('nav.1.group', 'การขาย')
            ->where('nav.1.items.0', [
                'label' => 'คำสั่งซื้อ', 'icon' => 'shopping-cart', 'url' => url('/admin/orders'), 'active' => true,
                'badge' => '2', 'external' => false, 'legacy' => false,
            ])
            ->where('nav.1.items.1.label', 'นำเข้าคำสั่งซื้อ')
            ->where('nav.1.items.1.legacy', true)
            ->missing('nav.2'));

    $this->actingAs($this->admin(1))
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page->where('nav.2.group', 'รายงาน')->where('nav.2.items.0.label', 'ยอดขาย'));
});

it('takes the help URL from the route, else the set topics', function (): void {
    $this->actingAs($this->admin(1))
        ->get('/admin/reports/sales')
        ->assertInertia(fn (Assert $page): Assert => $page->where('panel.help', '/help/reports'));
});

it('lists the switcher: business entries and panels, a divider, then tool panels the user may open', function (): void {
    $this->actingAs($this->admin(1))
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('panels.0.id', 'filament')
            ->where('panels.1.id', 'admin')
            ->where('panels.1.current', true)
            ->where('panels.1.divider_after', true)
            ->where('panels.2.id', 'tools'));
});

it('gives a panel\'s switcher row its brand logo, and an entry none', function (): void {
    $this->actingAs($this->admin(1))
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('panels.0.logo', null)
            ->where('panels.1.logo', asset('images/brand-mark.svg'))
            ->where('panels.2.logo', 'https://cdn.example.com/mark.svg'));

    $this->actingAs($this->admin(2))
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page->has('panels', 2));
});

it('runs a set endpoint inside the panel prefix, middleware and name prefix, and shares its flash', function (): void {
    $order = Order::query()->create(['number' => 'SO-2', 'status' => 'paid']);

    $this->actingAs($this->admin())
        ->from('/admin/orders')
        ->post("/admin/orders/{$order->id}/ship")
        ->assertRedirect('/admin/orders');

    expect($order->fresh()->status)->toBe('shipped');

    $this->actingAs($this->admin())
        ->withSession(['flash' => 'ส่งของแล้ว'])
        ->get('/admin/orders')
        ->assertInertia(fn (Assert $page): Assert => $page->where('flash.message', 'ส่งของแล้ว'));
});

it('serves the card index from a declared route', function (): void {
    $this->actingAs($this->admin())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::Home')
            ->where('title', 'ร้านค้า')
            ->where('description', 'คำสั่งซื้อ · ลูกค้า')
            ->where('breadcrumbs', []));
});

it('skips a registered set class that does not exist instead of breaking every request', function (): void {
    expect(app(PanelRegistry::class)->missingClasses())
        ->toBe(['admin' => ['Phattarachai\\Tungsten\\Tests\\Fixtures\\Sets\\NotWrittenYetSet']]);

    $this->actingAs($this->admin())->get('/admin/orders')->assertOk();
});

it('hides the sign-out link when the panel has no logout target', function (): void {
    $this->actingAs($this->admin())
        ->get('/tools')
        ->assertInertia(fn (Assert $page): Assert => $page->where('auth.logoutUrl', null)->where('panel.rail', '#1d1f36'));
});

it('shares the panel layout defaults, overridden key by key by the route', function (): void {
    $this->actingAs($this->admin())
        ->get('/tools')
        ->assertInertia(fn (Assert $page): Assert => $page->where('layout', ['sheet' => true, 'mainClassName' => 'tools-main']));

    $this->actingAs($this->admin())
        ->get('/tools/wide')
        ->assertInertia(fn (Assert $page): Assert => $page->where('layout', ['sheet' => false, 'mainClassName' => 'tools-main', 'flush' => true]));
});

it('shares the filter layout from config, overridden per panel', function (): void {
    $this->actingAs($this->admin())->get('/admin/orders')->assertInertia(fn (Assert $page): Assert => $page->where('panel.filterLayout', 'bar'));
    $this->actingAs($this->admin())->get('/tools')->assertInertia(fn (Assert $page): Assert => $page->where('panel.filterLayout', 'menu'));

    config(['tungsten.filter_layout' => 'menu']);

    $this->actingAs($this->admin())->get('/admin/orders')->assertInertia(fn (Assert $page): Assert => $page->where('panel.filterLayout', 'menu'));
});

it('refuses an unknown filter layout', function (): void {
    Panel::make('x')->filterLayout('chips');
})->throws(InvalidArgumentException::class);

it('caps a page\'s content width from the route, merged with the rest of its layout', function (): void {
    $this->actingAs($this->admin())
        ->get('/tools/narrow')
        ->assertInertia(fn (Assert $page): Assert => $page->where('layout', ['sheet' => true, 'mainClassName' => 'tools-main', 'width' => '4xl', 'flush' => false]));
});

it('refuses an unknown page width', function (): void {
    Route::get('odd', HomePage::class)->width('wide');
})->throws(InvalidArgumentException::class, 'Unknown page width [wide]');

it('flashes a sample toast from the UI Kit page', function (): void {
    $this->actingAs($this->admin())
        ->get('/admin/ui-kit')
        ->assertInertia(fn (Assert $page): Assert => $page->component('tungsten::UiKit')->where('toastUrl', route('admin.ui-kit.toast')));

    $this->actingAs($this->admin())
        ->from('/admin/ui-kit')
        ->post('/admin/ui-kit/toast', ['tone' => 'warning'])
        ->assertRedirect('/admin/ui-kit')
        ->assertSessionHas('flash', ['message' => 'สินค้า 2 รายการใกล้หมดสต็อก', 'tone' => 'warning']);
});

it('turns Inertia DevTools off unless the app set it', function (): void {
    expect(config('inertia.devtools.enabled'))->toBeFalse();
});
