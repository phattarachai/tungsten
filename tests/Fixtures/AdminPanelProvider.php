<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures;

use Illuminate\Contracts\Auth\Authenticatable;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelProvider;
use Phattarachai\Tungsten\Tests\Fixtures\Search\CustomerSearch;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->path('admin')
            ->label('ร้านค้า')
            ->brand('ร้านค้า', tag: 'v2', logo: 'images/brand-mark.svg')
            ->globalSearch([CustomerSearch::class])
            ->description('คำสั่งซื้อ · ลูกค้า')
            ->color('#0d9488')
            ->brandColor('#0d9488')
            ->business()
            ->navigationGroups(['การขาย', 'รายงาน'])
            ->discoverSets(__DIR__.'/Sets', 'Phattarachai\\Tungsten\\Tests\\Fixtures\\Sets')
            ->sets(['Phattarachai\\Tungsten\\Tests\\Fixtures\\Sets\\NotWrittenYetSet'])
            ->login(
                labels: ['intro' => 'สำหรับพนักงานร้าน'],
                forgotPasswordUrl: '/forgot-password',
                authorize: fn (Authenticatable $user): bool|string => ($user->role ?? null) === 'system' ? 'บัญชีระบบใช้หน้านี้ไม่ได้' : true,
            );
    }
}
