<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Pages;

use Illuminate\Http\Request;
use Override;
use Phattarachai\Tungsten\Page;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

class OrderPage extends Page
{
    public function path(): string
    {
        return 'orders/{order}';
    }

    public function component(): string
    {
        return 'panel/orders/Show';
    }

    public function navLabel(): string
    {
        return 'คำสั่งซื้อ';
    }

    #[Override]
    public function breadcrumbs(Request $request): array
    {
        return [
            ['label' => 'คำสั่งซื้อ', 'url' => route('admin.orders')],
            ['label' => Order::query()->find($request->route('order'))?->number ?? '—'],
        ];
    }

    public function props(Request $request): array
    {
        $order = Order::query()->findOrFail($request->route('order'));

        return ['order' => ['id' => $order->id, 'number' => $order->number]];
    }
}
