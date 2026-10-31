<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Pages;

use Illuminate\Http\Request;
use Override;
use Phattarachai\Tungsten\Page;

class ReportsPage extends Page
{
    public function path(): string
    {
        return 'reports/sales';
    }

    public function component(): string
    {
        return 'panel/reports/Sales';
    }

    public function navLabel(): string
    {
        return 'ยอดขาย';
    }

    #[Override]
    public function navGroup(): ?string
    {
        return 'รายงาน';
    }

    #[Override]
    public function ability(): ?string
    {
        return 'viewReports';
    }

    public function props(Request $request): array
    {
        return [];
    }
}
