<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Pages;

use Illuminate\Http\Request;
use Phattarachai\Tungsten\Page;

class ReportsPage extends Page
{
    public function component(): string
    {
        return 'panel/reports/Sales';
    }

    public function props(Request $request): array
    {
        return [];
    }
}
