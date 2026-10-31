<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Exceptions;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Exceptions\ReservedPropName;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

it('throws while debugging when a page returns a prop the panel shares', function (): void {
    config(['app.debug' => true]);

    $this->withoutExceptionHandling()->actingAs($this->admin())->get('/admin/clashing-props');
})->throws(ReservedPropName::class, 'page [panel/orders/More] returns the prop(s) [panels, nav]');

it('reports it in production and still renders', function (): void {
    Exceptions::fake();

    $this->actingAs($this->admin())->get('/admin/clashing-props')->assertOk();

    Exceptions::assertReported(fn (ReservedPropName $exception): bool => str_contains($exception->getMessage(), '[panels, nav]'));
});

it('leaves breadcrumbs and layout overridable, and other pages alone', function (): void {
    Exceptions::fake();
    config(['app.debug' => true]);
    $order = Order::query()->create(['number' => 'SO-1', 'status' => 'new']);

    $this->actingAs($this->admin())
        ->get("/admin/orders/{$order->id}")
        ->assertInertia(fn (Assert $page): Assert => $page->has('breadcrumbs'));

    Exceptions::assertNothingReported();
});
