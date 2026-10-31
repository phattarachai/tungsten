<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Pages;

use Illuminate\Http\Request;
use Override;
use Phattarachai\Tungsten\Page;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;
use Phattarachai\Tungsten\Tungsten;

class OrderPage extends Page
{
    public function component(): string
    {
        return 'panel/orders/Show';
    }

    #[Override]
    public function breadcrumbs(Request $request): array
    {
        return Tungsten::breadcrumbs(Order::query()->find($request->route('order'))?->number ?? '—');
    }

    public function props(Request $request): array
    {
        $order = Order::query()->findOrFail($request->route('order'));

        return ['order' => ['id' => $order->id, 'number' => $order->number]];
    }
}
