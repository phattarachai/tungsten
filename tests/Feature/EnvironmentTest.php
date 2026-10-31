<?php

declare(strict_types=1);

use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Tungsten;

function inEnvironment(string $name): void
{
    app()['env'] = $name;
}

it('maps the kit environments: nothing in production, a label and tone elsewhere', function (): void {
    inEnvironment('production');
    expect(Tungsten::environment())->toBeNull();

    inEnvironment('local');
    expect(Tungsten::environment())->toBe(['label' => 'Local', 'tone' => 'active']);

    inEnvironment('staging');
    expect(Tungsten::environment())->toBe(['label' => 'Staging', 'tone' => 'done']);

    inEnvironment('uat');
    expect(Tungsten::environment())->toBe(['label' => 'UAT', 'tone' => 'todo']);

    inEnvironment('qa');
    expect(Tungsten::environment())->toBe(['label' => 'qa', 'tone' => 'draft']);
});

it('lets the app relabel, retone or hide an environment over the defaults', function (): void {
    config(['tungsten.environments' => ['staging' => ['label' => 'Dev', 'tone' => 'done'], 'uat' => null]]);

    inEnvironment('staging');
    expect(Tungsten::environment())->toBe(['label' => 'Dev', 'tone' => 'done']);

    inEnvironment('uat');
    expect(Tungsten::environment())->toBeNull();

    inEnvironment('local');
    expect(Tungsten::environment())->toBe(['label' => 'Local', 'tone' => 'active']);
});

it('shares panel.env and prefixes the first-paint title and the env meta', function (): void {
    config(['tungsten.environments' => ['testing' => ['label' => 'UAT', 'tone' => 'todo']], 'app.name' => 'Shop Backoffice']);

    $this->actingAs($this->admin())
        ->get('/admin/orders')
        ->assertSee('<meta name="tungsten-env" content="UAT">', false)
        ->assertSee('<title inertia>UAT · Shop Backoffice</title>', false)
        ->assertInertia(fn (Assert $page): Assert => $page->where('panel.env', ['label' => 'UAT', 'tone' => 'todo'])->where('panel.environment', 'testing'));
});

it('shows nothing where the environment is hidden', function (): void {
    config(['tungsten.environments' => ['testing' => null], 'app.name' => 'Shop Backoffice']);

    $this->actingAs($this->admin())
        ->get('/admin/orders')
        ->assertDontSee('tungsten-env', false)
        ->assertSee('<title inertia>Shop Backoffice</title>', false)
        ->assertInertia(fn (Assert $page): Assert => $page->where('panel.env', null));
});
