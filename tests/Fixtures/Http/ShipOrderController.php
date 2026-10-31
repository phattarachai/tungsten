<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Http;

use Illuminate\Http\RedirectResponse;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

class ShipOrderController
{
    public function __invoke(int $order): RedirectResponse
    {
        Order::query()->whereKey($order)->update(['status' => 'shipped']);

        return back()->with('flash', 'ส่งของแล้ว');
    }
}
