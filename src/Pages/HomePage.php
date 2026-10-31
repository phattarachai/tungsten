<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Pages;

use Illuminate\Http\Request;
use Override;
use Phattarachai\Tungsten\Page;
use Phattarachai\Tungsten\PanelRegistry;

/**
 * A card index of the panel's nav, for a panel root without a dashboard of its own:
 *
 *     Route::get('/', HomePage::class)->name('dashboard')->nav('หน้าหลัก', icon: 'layout-grid', sort: -1);
 */
class HomePage extends Page
{
    public function __construct(private readonly PanelRegistry $panels) {}

    public function component(): string
    {
        return 'tungsten::Home';
    }

    public function props(Request $request): array
    {
        $panel = $this->panels->forRoute($request->route()?->getName());

        return [
            'title' => $panel?->getLabel() ?? '',
            'description' => $panel?->getDescription() ?? '',
        ];
    }

    #[Override]
    public function breadcrumbs(Request $request): array
    {
        return [];
    }
}
