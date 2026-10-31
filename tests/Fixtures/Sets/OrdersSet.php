<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Sets;

use Illuminate\Support\Facades\Route;
use Phattarachai\Tungsten\PanelSet;
use Phattarachai\Tungsten\Tests\Fixtures\Http\ShipOrderController;
use Phattarachai\Tungsten\Tests\Fixtures\Pages\OrderPage;
use Phattarachai\Tungsten\Tests\Fixtures\Pages\OrdersPage;

class OrdersSet extends PanelSet
{
    public static function pages(): array
    {
        return [OrdersPage::class, OrderPage::class, 'Phattarachai\\Tungsten\\Tests\\Fixtures\\Pages\\NotWrittenYetPage'];
    }

    public static function routes(): void
    {
        Route::post('orders/{order}/ship', ShipOrderController::class)->name('orders.ship')->whereNumber('order');
    }

    public static function links(): array
    {
        return [['label' => 'นำเข้าคำสั่งซื้อ', 'url' => '/orders/import', 'group' => 'การขาย', 'legacy' => true, 'sort' => 5]];
    }

    public static function helpTopics(): array
    {
        return ['admin.orders*' => '/help/orders'];
    }
}
