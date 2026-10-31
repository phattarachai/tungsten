<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures;

use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelProvider;
use Phattarachai\Tungsten\PanelRegistry;

class ToolsPanelProvider extends PanelProvider
{
    public function id(): string
    {
        return 'tools';
    }

    public function panel(Panel $panel): Panel
    {
        app(PanelRegistry::class)->entry(id: 'filament', label: 'ระบบเดิม', url: '/', short: 'v1');

        return $panel->label('Tools')->rail('#1d1f36')->logoutUrl(false);
    }
}
