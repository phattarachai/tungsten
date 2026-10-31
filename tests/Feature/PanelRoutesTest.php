<?php

declare(strict_types=1);

use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Http\Middleware\HandleTungstenRequests;
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

it('generates no route from a page class: only declared routes exist', function (): void {
    $names = collect(app('router')->getRoutes()->getRoutes())->map->getName()->filter(fn (?string $name): bool => str_starts_with((string) $name, 'admin.'))->sort()->values()->all();

    expect($names)->toBe(['admin.dashboard', 'admin.orders', 'admin.orders.edit', 'admin.orders.ship', 'admin.orders.show', 'admin.reports.sales', 'admin.ui-kit', 'admin.ui-kit.toast']);
});

it('runs every panel route behind the configured middleware, the gate and the panel middleware', function (): void {
    expect(app('router')->getRoutes()->getByName('admin.orders')->gatherMiddleware())
        ->toBe(['web', 'auth', 'can:accessAdmin', HandleTungstenRequests::class]);
});

it('sends a guest to the login route', function (): void {
    $this->get('/admin/orders')->assertRedirect('/login');
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
            ->where('auth.logoutUrl', url('/logout'))
            ->where('panel.id', 'admin')
            ->where('panel.label', 'ร้านค้า')
            ->where('panel.help', '/help/orders')
            ->where('panel.home', url('/admin'))
            ->where('breadcrumbs', [['label' => 'การขาย'], ['label' => 'คำสั่งซื้อ']])
            ->where('flash', ['message' => null, 'status' => null])
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
