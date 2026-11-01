<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Notifications;

use Illuminate\Notifications\Notification;
use Phattarachai\Tungsten\Notifications\PanelNotification;

class OrderPaid extends Notification
{
    public function __construct(private readonly string $number) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, ?string>
     */
    public function toDatabase(object $notifiable): array
    {
        return PanelNotification::make('ชำระเงินแล้ว')->body("คำสั่งซื้อ {$this->number}")->url("/admin/orders/{$this->number}")->tone('done')->icon('wallet')->toArray();
    }
}
