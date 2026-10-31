<?php

declare(strict_types=1);

use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Http\Middleware\HandleTungstenRequests;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

it('mounts every page under its panel path with the {id}. route name', function (): void {
    expect(route('admin.dashboard'))->toEndWith('/admin')
        ->and(route('admin.orders'))->toEndWith('/admin/orders')
        ->and(route('admin.orders.show', 5))->toEndWith('/admin/orders/5')
        ->and(route('admin.reports.sales'))->toEndWith('/admin/reports/sales')
        ->and(route('admin.ui-kit'))->toEndWith('/admin/ui-kit')
        ->and(route('admin.orders.ship', 5))->toEndWith('/admin/orders/5/ship')
        ->and(route('tools.dashboard'))->toEndWith('/tools');
});

it('runs every panel route behind the configured middleware, the gate and the panel middleware', function (): void {
    $middleware = app('router')->getRoutes()->getByName('admin.orders')->gatherMiddleware();

    expect($middleware)->toBe(['web', 'auth', 'can:accessAdmin', HandleTungstenRequests::class]);
});

it('sends a guest to the login route', function (): void {
    $this->get('/admin/orders')->assertRedirect('/login');
});

it('refuses a user who fails the panel ability', function (): void {
    $this->actingAs($this->admin(500))->get('/admin/orders')->assertForbidden();
});

it('refuses a page whose own ability the user fails', function (): void {
    $this->actingAs($this->admin(2))->get('/admin/reports/sales')->assertForbidden();
    $this->actingAs($this->admin(1))->get('/admin/reports/sales')->assertOk();
});

it('renders a page with its component, props and the shared panel props', function (): void {
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
            ->has('nav')
            ->has('panels'));
});

it('puts the panel brand colour on the root element', function (): void {
    $this->actingAs($this->admin())
        ->get('/admin/orders')
        ->assertSee('class="tungsten" style="--color-brand: #0d9488"', false);
});

it('builds the nav in group order, hides gated pages, marks the active page and its detail pages', function (): void {
    $order = Order::query()->create(['number' => 'SO-9', 'status' => 'new']);

    $this->actingAs($this->admin(2))
        ->get("/admin/orders/{$order->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('panel/orders/Show')
            ->where('nav.0.group', null)
            ->where('nav.0.items.0.label', 'หน้าหลัก')
            ->where('nav.0.items.1.label', 'UI Kit')
            ->where('nav.1.group', 'การขาย')
            ->where('nav.1.items.0.label', 'คำสั่งซื้อ')
            ->where('nav.1.items.0.active', true)
            ->where('nav.1.items.1.label', 'นำเข้าคำสั่งซื้อ')
            ->where('nav.1.items.1.legacy', true)
            ->where('nav.1.items.1.external', false)
            ->missing('nav.2')
            ->where('breadcrumbs.1.label', 'SO-9'));
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

it('404s a non-numeric or oversized route parameter instead of reaching the database', function (): void {
    $this->actingAs($this->admin())->get('/admin/orders/abc')->assertNotFound();
    $this->actingAs($this->admin())->get('/admin/orders/99999999999999999999')->assertNotFound();
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

it('mounts a card index at the panel root when the panel has no root page', function (): void {
    $this->actingAs($this->admin())
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::Home')
            ->where('title', 'ร้านค้า')
            ->where('description', 'คำสั่งซื้อ · ลูกค้า')
            ->where('breadcrumbs', []));
});

it('skips a registered page class that does not exist instead of breaking every request', function (): void {
    expect(app(PanelRegistry::class)->missingClasses())
        ->toBe(['admin' => ['Phattarachai\\Tungsten\\Tests\\Fixtures\\Pages\\NotWrittenYetPage']]);

    $this->actingAs($this->admin())->get('/admin/orders')->assertOk();
});

it('hides the sign-out link when the panel has no logout target', function (): void {
    $this->actingAs($this->admin())
        ->get('/tools')
        ->assertInertia(fn (Assert $page): Assert => $page->where('auth.logoutUrl', null)->where('panel.rail', '#1d1f36'));
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
