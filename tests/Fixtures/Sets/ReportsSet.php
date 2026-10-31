<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Sets;

use Phattarachai\Tungsten\PanelSet;
use Phattarachai\Tungsten\Tests\Fixtures\Pages\ReportsPage;

class ReportsSet extends PanelSet
{
    public static function pages(): array
    {
        return [ReportsPage::class];
    }
}
