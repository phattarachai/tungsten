<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Pages;

use Illuminate\Http\Request;
use Override;
use Phattarachai\Tungsten\Page;
use Phattarachai\Tungsten\PanelRegistry;

/**
 * The panel root when the panel has no page of its own there: a card index of its nav.
 */
class HomePage extends Page
{
    public function __construct(private readonly PanelRegistry $panels) {}

    public function path(): string
    {
        return '';
    }

    public function component(): string
    {
        return 'tungsten::Home';
    }

    public function navLabel(): string
    {
        return 'หน้าหลัก';
    }

    #[Override]
    public function navIcon(): ?string
    {
        return 'layout-grid';
    }

    #[Override]
    public function navSort(): int
    {
        return -1000;
    }

    #[Override]
    public function breadcrumbs(Request $request): array
    {
        return [];
    }

    public function props(Request $request): array
    {
        $panel = $this->panels->forRoute($request->route()?->getName());

        return [
            'title' => $panel?->getLabel() ?? $this->navLabel(),
            'description' => $panel?->getDescription() ?? '',
        ];
    }
}
