<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * An invokable page controller: a component and its props. Route it like any controller —
 * `Route::get('orders', OrdersPage::class)->name('orders')->nav('คำสั่งซื้อ')` — or skip it and render from a plain
 * controller with `Inertia::render()`; the panel treats both the same.
 *
 * @see docs/kernel.md
 */
abstract class Page
{
    abstract public function component(): string;

    /**
     * @return array<string, mixed>
     */
    abstract public function props(Request $request): array;

    /**
     * Breadcrumbs for this request, replacing the ones derived from the route's metadata; null keeps those.
     * Look records up with `find()`, never `findOrFail()`. `Tungsten::breadcrumbs('SO-001')` gives the parent trail
     * plus a leaf.
     *
     * @return list<array{label: string, url?: string}>|null
     */
    public function breadcrumbs(Request $request): ?array
    {
        return null;
    }

    public function __invoke(Request $request): Response
    {
        $breadcrumbs = $this->breadcrumbs($request);

        return Inertia::render($this->component(), [
            ...$this->props($request),
            ...($breadcrumbs === null ? [] : ['breadcrumbs' => $breadcrumbs]),
        ]);
    }
}
