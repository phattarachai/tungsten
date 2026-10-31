<?php

declare(strict_types=1);

use Illuminate\Routing\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Http\Controllers\PageController;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

it('gives every page route a controller action, never a closure', function (): void {
    $pages = collect(app('router')->getRoutes()->getRoutes())
        ->filter(fn (Route $route): bool => str_starts_with((string) $route->getName(), 'admin.') || str_starts_with((string) $route->getName(), 'tools.'));

    expect($pages)->not->toBeEmpty();

    $pages->each(fn (Route $route) => expect($route->getAction('uses'))->toBeString()->not->toContain('Closure'));
    expect(app('router')->getRoutes()->getByName('admin.orders')->getAction('uses'))->toBe(PageController::class.'@__invoke');
});

it('serves pages from a compiled, var_export-ed route cache the way route:cache writes it', function (): void {
    $routes = app('router')->getRoutes();

    foreach ($routes as $route) {
        $route->prepareForSerialization();
    }

    $compiled = eval('return '.var_export($routes->compile(), true).';');
    app('router')->setCompiledRoutes($compiled);

    $order = Order::query()->create(['number' => 'SO-7', 'status' => 'new']);

    $this->actingAs($this->admin())
        ->get("/admin/orders/{$order->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page->component('panel/orders/Show')->where('order.number', 'SO-7'));

    $this->actingAs($this->admin())->get('/admin/orders/abc')->assertNotFound();
});
