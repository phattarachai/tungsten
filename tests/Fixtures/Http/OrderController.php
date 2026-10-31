<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Http;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

class OrderController
{
    public function edit(int $order): Response
    {
        return Inertia::render('panel/orders/Edit', ['order' => Order::query()->findOrFail($order)->only('id', 'number')]);
    }

    public function ship(int $order): RedirectResponse
    {
        Order::query()->whereKey($order)->update(['status' => 'shipped']);

        return back()->with('flash', 'ส่งของแล้ว');
    }
}
