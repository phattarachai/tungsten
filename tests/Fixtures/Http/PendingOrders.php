<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Http;

use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

class PendingOrders
{
    public function __invoke(): ?string
    {
        $count = Order::query()->where('status', 'new')->count();

        return $count === 0 ? null : (string) $count;
    }
}
