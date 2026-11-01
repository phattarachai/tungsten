<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Routing\Route;
use InvalidArgumentException;

/**
 * Panel metadata on plain Laravel routes, stored in the route action under `tungsten` (plain arrays, so
 * `route:cache` keeps it):
 *
 *     Route::get('orders', OrdersPage::class)->name('orders')
 *         ->nav('คำสั่งซื้อ', icon: 'shopping-cart', group: 'การขาย', sort: 1, badge: PendingOrders::class);
 *     Route::get('orders/{order}/edit', EditOrderPage::class)->name('orders.edit')->whereNumber('order')
 *         ->breadcrumb('แก้ไข');
 *     Route::get('reports', ReportsPage::class)->name('reports')->help('/help/reports')->layout(['flush' => true]);
 *
 * @see docs/kernel.md
 */
class RouteMeta
{
    /** The content widths a page may take (Tailwind's max-w steps); `full` leaves it uncapped, `fit` hugs its widest child. */
    public const array WIDTHS = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full', 'fit'];

    /**
     * @return array<string, mixed>
     */
    public static function of(?Route $route): array
    {
        $meta = $route?->getAction('tungsten');

        return is_array($meta) ? $meta : [];
    }

    public static function register(): void
    {
        /** @param  string|null  $badge  a fixed string, or the class of an invokable that returns one per request */
        Route::macro('nav', function (string $label, ?string $icon = null, ?string $group = null, int $sort = 0, ?string $badge = null, ?string $ability = null): Route {
            /** @var Route $this */
            return RouteMeta::put($this, 'nav', compact('label', 'icon', 'group', 'sort', 'badge', 'ability'));
        });

        /** The trail's last label; the parent nav route (inferred from the route name, or `parent`) links before it. */
        Route::macro('breadcrumb', function (string $label, ?string $parent = null): Route {
            /** @var Route $this */
            return RouteMeta::put($this, 'breadcrumb', compact('label', 'parent'));
        });

        /** A fixed trail: `[['label' => 'ตั้งค่า'], ['label' => 'SMS', 'route' => 'admin.settings.sms']]`. */
        Route::macro('breadcrumbs', function (array $breadcrumbs): Route {
            /** @var Route $this */
            return RouteMeta::put($this, 'breadcrumbs', $breadcrumbs);
        });

        Route::macro('help', function (string $url): Route {
            /** @var Route $this */
            return RouteMeta::put($this, 'help', $url);
        });

        /** Caps the page's content width inside the sheet (`'4xl'`, `'5xl'`, `'7xl'` …, `'full'` or `'fit'`): layout `width`. */
        Route::macro('width', function (string $width): Route {
            /** @var Route $this */
            throw_unless(in_array($width, RouteMeta::WIDTHS, true), InvalidArgumentException::class, "Unknown page width [{$width}]; use one of: ".implode(', ', RouteMeta::WIDTHS).'.');

            return RouteMeta::put($this, 'layout', [...(RouteMeta::of($this)['layout'] ?? []), 'width' => $width]);
        });

        /** Defaults for AppLayout (`sheet`, `flush`, `width`, `sidebar`, `topbar`, `className`, `mainClassName`), shared as `layout`. */
        Route::macro('layout', function (array $layout): Route {
            /** @var Route $this */
            return RouteMeta::put($this, 'layout', [...(RouteMeta::of($this)['layout'] ?? []), ...$layout]);
        });
    }

    public static function put(Route $route, string $key, mixed $value): Route
    {
        $route->action['tungsten'][$key] = $value;

        return $route;
    }
}
