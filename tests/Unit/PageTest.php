<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Phattarachai\Tungsten\Page;

function page(string $path): Page
{
    return new class($path) extends Page
    {
        public function __construct(private readonly string $at) {}

        public function path(): string
        {
            return $this->at;
        }

        public function component(): string
        {
            return 'panel/Test';
        }

        public function navLabel(): string
        {
            return 'ทดสอบ';
        }

        public function props(Request $request): array
        {
            return [];
        }
    };
}

it('derives the route key from the path the way resource routes are named', function (string $path, string $key): void {
    expect(page($path)->routeKey())->toBe($key);
})->with([
    ['', 'dashboard'],
    ['orders', 'orders'],
    ['/orders/', 'orders'],
    ['orders/{order}', 'orders.show'],
    ['orders/{order}/edit', 'orders.edit'],
    ['orders/create', 'orders.create'],
    ['settings/sms', 'settings.sms'],
    ['customers/{customer}/points/{point}', 'customers.points.show'],
]);

it('constrains every route parameter to a bigint-sized number by default', function (): void {
    expect(page('customers/{customer}/points/{point?}')->wheres())->toBe(['customer' => '[0-9]{1,18}', 'point' => '[0-9]{1,18}'])
        ->and(page('orders')->wheres())->toBe([]);
});

it('keeps parameterised pages out of the nav and breadcrumbs the group then the label', function (): void {
    expect(page('orders/{order}')->showInNavigation())->toBeFalse()
        ->and(page('orders')->showInNavigation())->toBeTrue()
        ->and(page('orders')->breadcrumbs(Request::create('/')))->toBe([['label' => 'ทดสอบ']]);
});
