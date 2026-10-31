<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Sets;

use Illuminate\Support\Facades\Route;
use Phattarachai\Tungsten\PanelSet;
use Phattarachai\Tungsten\Tests\Fixtures\Pages\ReportsPage;

class ReportsSet extends PanelSet
{
    public static function routes(): void
    {
        Route::get('reports/sales', ReportsPage::class)->name('reports.sales')->middleware('can:viewReports')
            ->nav('ยอดขาย', group: 'รายงาน')->help('/help/reports');
    }
}
