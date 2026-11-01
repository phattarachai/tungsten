<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Notifications;

use Illuminate\Contracts\Support\Arrayable;

/**
 * What a database notification stores for the panel's bell. Return `->toArray()` from a notification's `toDatabase()`
 * (or build the same keys by hand: `title`, `body`, `url`, `tone`, `icon`):
 *
 *     public function toDatabase(object $notifiable): array
 *     {
 *         return PanelNotification::make('ชำระเงินแล้ว')->body("คำสั่งซื้อ {$this->order->number}")
 *             ->url(route('admin.orders.show', $this->order))->tone('done')->icon('wallet')->toArray();
 *     }
 *
 * @implements Arrayable<string, ?string>
 */
final class PanelNotification implements Arrayable
{
    private ?string $body = null;

    private ?string $url = null;

    private ?string $tone = null;

    private ?string $icon = null;

    private function __construct(private readonly string $title) {}

    public static function make(string $title): self
    {
        return new self($title);
    }

    public function body(?string $body): self
    {
        $this->body = $body;

        return $this;
    }

    public function url(?string $url): self
    {
        $this->url = $url;

        return $this;
    }

    /** A status tone (`todo`, `done`, `failed` …) for the mark beside it. */
    public function tone(?string $tone): self
    {
        $this->tone = $tone;

        return $this;
    }

    /** A kit icon name (`wallet`, `truck` …). */
    public function icon(?string $icon): self
    {
        $this->icon = $icon;

        return $this;
    }

    /**
     * @return array{title: string, body: ?string, url: ?string, tone: ?string, icon: ?string}
     */
    public function toArray(): array
    {
        return ['title' => $this->title, 'body' => $this->body, 'url' => $this->url, 'tone' => $this->tone, 'icon' => $this->icon];
    }
}
