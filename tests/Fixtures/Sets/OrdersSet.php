<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Sets;

use Illuminate\Support\Facades\Route;
use Phattarachai\Tungsten\PanelSet;
use Phattarachai\Tungsten\Tests\Fixtures\Http\OrderController;
use Phattarachai\Tungsten\Tests\Fixtures\Http\PendingOrders;
use Phattarachai\Tungsten\Tests\Fixtures\Pages\OrderPage;
use Phattarachai\Tungsten\Tests\Fixtures\Pages\OrdersPage;

class OrdersSet extends PanelSet
{
    public static function routes(): void
    {
        Route::get('orders', OrdersPage::class)->name('orders')->nav('คำสั่งซื้อ', icon: 'shopping-cart', group: 'การขาย', badge: PendingOrders::class);
        Route::get('orders/{order}', OrderPage::class)->name('orders.show')->whereNumber('order');
        Route::get('orders/{order}/edit', [OrderController::class, 'edit'])->name('orders.edit')->whereNumber('order')->breadcrumb('แก้ไข')->layout(['flush' => true]);
        Route::post('orders/{order}/ship', [OrderController::class, 'ship'])->name('orders.ship')->whereNumber('order');
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
