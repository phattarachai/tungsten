<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Search;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Phattarachai\Tungsten\Search\GlobalSearch;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

/**
 * @extends GlobalSearch<Order>
 */
class OrderSearch extends GlobalSearch
{
    public function label(): string
    {
        return 'คำสั่งซื้อ';
    }

    public function query(): Builder
    {
        return Order::query()->with('customer')->latest('id');
    }

    public function attributes(): array
    {
        return ['number', 'customer.name'];
    }

    public function title(Model $record): string
    {
        return $record->number;
    }

    public function details(Model $record): array
    {
        return ['ลูกค้า' => $record->customer?->name, 'สถานะ' => $record->status];
    }

    public function url(Model $record): string
    {
        return route('admin.orders.show', $record);
    }

    public function limit(): int
    {
        return 2;
    }
}
