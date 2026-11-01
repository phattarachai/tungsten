<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Phattarachai\Tungsten\Search\GlobalSearch;

/**
 * One menu set of a panel — its routes, links and help topics in one class, so parallel work adds a file instead of
 * editing the panel provider. A panel picks sets up with `->sets([...])` or `->discoverSets(...)`.
 *
 * @see docs/kernel.md
 */
abstract class PanelSet
{
    /**
     * Plain Laravel routes, registered inside the panel's prefix, middleware and `{id}.` name prefix:
     *
     *     Route::get('orders', OrdersPage::class)->name('orders')->nav('คำสั่งซื้อ', icon: 'shopping-cart', group: 'การขาย');
     *     Route::get('orders/{order}', OrderPage::class)->name('orders.show')->whereNumber('order');
     *     Route::put('orders/{order}', [OrderController::class, 'update'])->name('orders.update')->whereNumber('order');
     */
    public static function routes(): void {}

    /**
     * Sidebar links to screens outside the panel (e.g. a page still on the old admin).
     *
     * @return list<array{label: string, url?: string, route?: string, icon?: ?string, group?: ?string, sort?: int, ability?: ?string, legacy?: bool}>
     */
    public static function links(): array
    {
        return [];
    }

    /**
     * Route-name pattern → help URL for the topbar `?`, e.g. `['admin.orders*' => '/help/orders']`.
     *
     * @return array<string, string>
     */
    public static function helpTopics(): array
    {
        return [];
    }

    /**
     * This set's kinds of records for the panel's global search (each a {@see GlobalSearch} class).
     *
     * @return list<class-string<GlobalSearch>>
     */
    public static function searches(): array
    {
        return [];
    }
}
