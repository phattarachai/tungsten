<?php

declare(strict_types=1);

use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Foundation\Configuration\Exceptions;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Tungsten;

beforeEach(function (): void {
    Tungsten::handleExceptions(new Exceptions(app(ExceptionHandler::class)));
});

it('renders the panel error page for a 404 under a panel path', function (): void {
    $this->actingAs($this->admin())
        ->get('/admin/orders/123')
        ->assertNotFound()
        ->assertViewIs('tungsten::app')
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::errors/Error')
            ->where('status', 404)
            ->where('home', url('/admin')));
});

it('renders it for a 403 from the panel gate, before the panel middleware ran', function (): void {
    $this->actingAs($this->admin(500))
        ->get('/admin/orders')
        ->assertForbidden()
        ->assertInertia(fn (Assert $page): Assert => $page->component('tungsten::errors/Error')->where('status', 403));
});

it('leaves JSON requests and paths outside every panel alone', function (): void {
    $this->actingAs($this->admin())->getJson('/admin/orders/123')->assertNotFound()->assertJsonStructure(['message']);
    $this->get('/nowhere')->assertNotFound()->assertDontSee('tungsten::errors/Error', false);
});

it('keeps the stack trace of a 500 while debugging', function (): void {
    config(['app.debug' => true]);

    $response = Tungsten::errorPage(request()->create('/admin/orders'), response('boom', 500));

    expect($response->getContent())->toBe('boom');
});
