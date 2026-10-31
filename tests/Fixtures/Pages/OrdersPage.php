<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Pages;

use Illuminate\Http\Request;
use Override;
use Phattarachai\Tungsten\Page;
use Phattarachai\Tungsten\Table\TableQuery;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

class OrdersPage extends Page
{
    public function path(): string
    {
        return 'orders';
    }

    public function component(): string
    {
        return 'panel/orders/Index';
    }

    public function navLabel(): string
    {
        return 'คำสั่งซื้อ';
    }

    #[Override]
    public function navGroup(): ?string
    {
        return 'การขาย';
    }

    #[Override]
    public function navIcon(): ?string
    {
        return 'shopping-cart';
    }

    public function props(Request $request): array
    {
        return [
            'orders' => TableQuery::for(Order::query(), $request)
                ->search(['number', 'customer.name'])
                ->filter('status', in: ['new', 'paid', 'shipped'])
                ->sorts(['number', 'total', 'created_at'])
                ->defaultSort('created_at', 'desc')
                ->perPage(2, [2, 50])
                ->paginate(fn (Order $order): array => ['id' => $order->id, 'number' => $order->number, 'url' => route('admin.orders.show', $order->id)]),
        ];
    }
}
