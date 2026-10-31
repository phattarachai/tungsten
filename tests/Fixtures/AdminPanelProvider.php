<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures;

use Phattarachai\Tungsten\Pages\UiKitPage;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelProvider;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->path('admin')
            ->label('ร้านค้า')
            ->description('คำสั่งซื้อ · ลูกค้า')
            ->color('#0d9488')
            ->brandColor('#0d9488')
            ->business()
            ->navigationGroups(['การขาย', 'รายงาน'])
            ->discoverSets(__DIR__.'/Sets', 'Phattarachai\\Tungsten\\Tests\\Fixtures\\Sets')
            ->pages([UiKitPage::class]);
    }
}
