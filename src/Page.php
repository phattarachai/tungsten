<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Str;

/**
 * @see docs/kernel.md
 */
abstract class Page
{
    abstract public function path(): string;

    abstract public function component(): string;

    abstract public function navLabel(): string;

    /**
     * @return array<string, mixed>
     */
    abstract public function props(Request $request): array;

    /**
     * `orders` → `orders`, `orders/{order}` → `orders.show`, `orders/{order}/edit` → `orders.edit`, `` → `dashboard`.
     */
    public function routeKey(): string
    {
        $path = trim($this->path(), '/');

        if ($path === '') {
            return 'dashboard';
        }

        $segments = collect(explode('/', $path));
        $key = $segments->reject(fn (string $segment): bool => str_starts_with($segment, '{'))->implode('.');

        return Str::startsWith((string) $segments->last(), '{') ? ltrim("{$key}.show", '.') : $key;
    }

    public function title(): string
    {
        return $this->navLabel();
    }

    public function navGroup(): ?string
    {
        return null;
    }

    public function navIcon(): ?string
    {
        return null;
    }

    public function navSort(): int
    {
        return 0;
    }

    public function navBadge(): ?string
    {
        return null;
    }

    public function ability(): ?string
    {
        return null;
    }

    public function visible(): bool
    {
        return true;
    }

    public function showInNavigation(): bool
    {
        return ! str_contains($this->path(), '{');
    }

    /**
     * Route parameter patterns. Every parameter is numeric (and short enough for a bigint) unless the page says
     * otherwise, so `/orders/abc` is a 404 instead of a database error.
     *
     * @return array<string, string>
     */
    public function wheres(): array
    {
        return collect($this->parameters())
            ->mapWithKeys(fn (string $parameter): array => [$parameter => '[0-9]{1,18}'])
            ->all();
    }

    /**
     * Last-mile route tweaks (extra middleware, `withTrashed()`, `scopeBindings()`).
     */
    public function route(Route $route): void {}

    /**
     * Endpoints this page owns (its form POSTs), registered inside the panel's prefix, middleware and name prefix.
     * Point them at controllers, not closures.
     */
    public function endpoints(): void {}

    /**
     * Look records up with `find()` here, never `findOrFail()`: breadcrumbs also render on the error path.
     *
     * @return list<array{label: string, url?: string}>
     */
    public function breadcrumbs(Request $request): array
    {
        return array_values(array_filter([
            $this->navGroup() === null ? null : ['label' => $this->navGroup()],
            ['label' => $this->navLabel()],
        ]));
    }

    /**
     * @return list<string>
     */
    public function parameters(): array
    {
        preg_match_all('/\{(\w+)\??\}/', $this->path(), $matches);

        return $matches[1];
    }
}
