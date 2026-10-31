<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Http;

use Inertia\Inertia;
use Inertia\Response;

class ClashingPropsController
{
    public function __invoke(): Response
    {
        return Inertia::render('panel/orders/More', ['panels' => ['tabs' => 'more'], 'nav' => 'x', 'title' => 'More']);
    }
}
