<?php

declare(strict_types=1);

use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Customer;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

beforeEach(function (): void {
    $somchai = Customer::query()->create(['name' => 'สมชาย 100% จริง']);
    $wanida = Customer::query()->create(['name' => 'วนิดา']);

    Order::query()->create(['number' => 'SO-1001', 'status' => 'paid', 'customer_id' => $somchai->id]);
    Order::query()->create(['number' => 'SO-1002', 'status' => 'new', 'customer_id' => $wanida->id]);
    Order::query()->create(['number' => 'SO-1003', 'status' => 'new', 'customer_id' => $wanida->id]);
    Order::query()->create(['number' => 'SO-2001', 'status' => 'new', 'customer_id' => $somchai->id]);
});

it('shares the search URL with panels that have searches, and none without', function (): void {
    $this->actingAs($this->admin())->get('/admin/orders')->assertInertia(fn (Assert $page): Assert => $page->where('panel.search', url('/admin/search')));
    $this->actingAs($this->admin())->get('/tools')->assertInertia(fn (Assert $page): Assert => $page->where('panel.search', null));
    $this->actingAs($this->admin())->get('/tools/search?q=so')->assertNotFound();
});

it('groups matches by kind, limited, with titles, urls and non-empty details', function (): void {
    $this->actingAs($this->admin(1))
        ->getJson('/admin/search?q=SO-100')
        ->assertOk()
        ->assertJsonCount(1, 'groups')
        ->assertJsonPath('groups.0.label', 'คำสั่งซื้อ')
        ->assertJsonPath('groups.0.icon', 'package')
        ->assertJsonCount(2, 'groups.0.results')
        ->assertJsonPath('groups.0.results.0.title', 'SO-1003')
        ->assertJsonPath('groups.0.results.0.url', url('/admin/orders/3'))
        ->assertJsonPath('groups.0.results.0.details', [['label' => 'ลูกค้า', 'value' => 'วนิดา'], ['label' => 'สถานะ', 'value' => 'new']]);
});

it('searches relations and the panel\'s kinds before its sets\', escaping LIKE wildcards', function (): void {
    $this->actingAs($this->admin(1))
        ->getJson('/admin/search?q='.urlencode('100%'))
        ->assertOk()
        ->assertJsonPath('groups.0.label', 'ลูกค้า')
        ->assertJsonPath('groups.0.icon', null)
        ->assertJsonPath('groups.0.results.0.title', 'สมชาย 100% จริง')
        ->assertJsonPath('groups.1.label', 'คำสั่งซื้อ')
        ->assertJsonPath('groups.1.results.0.title', 'SO-2001');

    $this->actingAs($this->admin(1))->getJson('/admin/search?q='.urlencode('%%'))->assertJsonPath('groups', []);
});

it('leaves out kinds the user may not see', function (): void {
    $this->actingAs($this->admin(2))
        ->getJson('/admin/search?q='.urlencode('สมชาย'))
        ->assertOk()
        ->assertJsonCount(1, 'groups')
        ->assertJsonPath('groups.0.label', 'คำสั่งซื้อ');
});

it('runs behind the panel auth and gate, and wants two characters', function (): void {
    $this->getJson('/admin/search?q=SO')->assertUnauthorized();
    $this->actingAs($this->admin(500))->getJson('/admin/search?q=SO')->assertForbidden();
    $this->actingAs($this->admin(1))->getJson('/admin/search?q=S')->assertUnprocessable()->assertJsonValidationErrors('q');
});
