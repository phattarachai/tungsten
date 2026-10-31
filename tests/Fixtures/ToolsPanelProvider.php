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
        app(PanelRegistry::class)
            ->entry(id: 'filament', label: 'ระบบเดิม', url: '/', short: 'v1')
            ->link('เว็บไซต์', 'https://shop.example.com/', image: 'images/store.png')
            ->link('Metabase', 'https://metabase.example.com', icon: 'gauge', ability: 'viewReports');

        return $panel->label('Tools')->brand('Tools', icon: 'wrench', logo: 'https://cdn.example.com/mark.svg')->rail('#1d1f36')->logoutUrl(false)->layout(['sheet' => true, 'mainClassName' => 'tools-main'])->filterLayout('menu');
    }
}
