<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

/**
 * One menu set of a panel — its pages, endpoints, links and help topics in one class, so parallel work adds a
 * file instead of editing the panel provider. A panel picks sets up with `->sets([...])` or `->discoverSets(...)`.
 *
 * @see docs/kernel.md
 */
abstract class PanelSet
{
    /**
     * @return list<class-string<Page>>
     */
    public static function pages(): array
    {
        return [];
    }

    /**
     * Extra endpoints (POST / PUT / JSON), registered inside the panel's prefix, middleware and name prefix.
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
}
