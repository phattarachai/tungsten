<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Phattarachai\Tungsten\Table\TableQuery;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Customer;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Order;

beforeEach(function (): void {
    $somchai = Customer::query()->create(['name' => 'Somchai Pharmacy']);
    $mana = Customer::query()->create(['name' => 'Mana Clinic']);

    collect([
        ['number' => 'SO-001', 'status' => 'new', 'total' => 300, 'customer_id' => $somchai->id, 'created_at' => '2026-10-01 09:00:00'],
        ['number' => 'SO-002', 'status' => 'paid', 'total' => null, 'customer_id' => $mana->id, 'created_at' => '2026-10-02 09:00:00'],
        ['number' => 'SO-003', 'status' => 'paid', 'total' => 100, 'customer_id' => $mana->id, 'created_at' => '2026-10-03 09:00:00'],
        ['number' => 'SO-100%', 'status' => 'shipped', 'total' => 200, 'customer_id' => null, 'created_at' => '2026-10-04 09:00:00'],
    ])->each(fn (array $order) => Order::query()->create($order));
});

function orders(array $query): TableQuery
{
    return TableQuery::for(Order::query(), Request::create('/admin/orders', 'GET', $query))
        ->search(['number', 'customer.name'])
        ->filter('status', in: ['new', 'paid', 'shipped'])
        ->filter('customer', fn (Builder $query, array $ids) => $query->whereIn('customer_id', $ids), multiple: true)
        ->sorts(['number', 'total', 'created' => 'created_at'])
        ->defaultSort('created', 'desc')
        ->perPage(2, [2, 3]);
}

function numbers(array $table): array
{
    return array_column($table['rows'], 'number');
}

it('pages with the default sort and returns the Pagination shape', function (): void {
    $table = orders([])->paginate(fn (Order $order): array => ['number' => $order->number]);

    expect(numbers($table))->toBe(['SO-100%', 'SO-003'])
        ->and($table['pagination'])->toBe(['current_page' => 1, 'last_page' => 2, 'per_page' => 2, 'total' => 4, 'from' => 1, 'to' => 2])
        ->and($table['sort'])->toBe(['key' => 'created', 'dir' => 'desc'])
        ->and($table['search'])->toBe('')
        ->and($table['filters'])->toBe(['status' => null, 'customer' => []])
        ->and($table['per_page'])->toBe(2);
});

it('sorts only by whitelisted keys and keeps blanks last in both directions', function (): void {
    expect(numbers(orders(['sort' => 'total', 'dir' => 'asc', 'per_page' => 3])->paginate()))->toBe(['SO-003', 'SO-100%', 'SO-001'])
        ->and(numbers(orders(['sort' => 'total', 'dir' => 'desc', 'page' => 2])->paginate()))->toBe(['SO-003', 'SO-002'])
        ->and(orders(['sort' => 'id; drop table orders', 'dir' => 'asc'])->state()['sort'])->toBe(['key' => 'created', 'dir' => 'desc']);
});

it('searches columns and relations, escaping LIKE wildcards', function (): void {
    expect(numbers(orders(['search' => 'mana'])->paginate()))->toBe(['SO-003', 'SO-002'])
        ->and(numbers(orders(['search' => '100%'])->paginate()))->toBe(['SO-100%'])
        ->and(orders(['search' => '%'])->paginate()['pagination']['total'])->toBe(1)
        ->and(orders(['search' => '  SO-001 '])->paginate()['search'])->toBe('SO-001');
});

it('applies whitelisted filters and multiple-value filters through their callbacks', function (): void {
    $customer = Customer::query()->where('name', 'Somchai Pharmacy')->value('id');

    expect(numbers(orders(['status' => 'paid'])->paginate()))->toBe(['SO-003', 'SO-002'])
        ->and(orders(['status' => 'deleted'])->paginate()['pagination']['total'])->toBe(4)
        ->and(orders(['status' => 'deleted'])->state()['filters']['status'])->toBeNull()
        ->and(numbers(orders(['customer' => [(string) $customer]])->paginate()))->toBe(['SO-001'])
        ->and(orders(['customer' => "{$customer},"])->state()['filters']['customer'])->toBe([(string) $customer]);
});

it('ignores a per_page outside the allowed list and a bad page number', function (): void {
    expect(orders(['per_page' => 1000])->paginate()['pagination']['per_page'])->toBe(2)
        ->and(orders(['page' => '-3'])->paginate()['pagination']['current_page'])->toBe(1)
        ->and(orders(['page' => ['x']])->paginate()['pagination']['current_page'])->toBe(1);
});

it('returns the filtered, sorted query for exports', function (): void {
    expect(orders(['status' => 'paid', 'sort' => 'number'])->query()->pluck('number')->all())->toBe(['SO-002', 'SO-003']);
});

it('accepts a search closure and a plain column filter', function (): void {
    $table = TableQuery::for(Order::query(), Request::create('/', 'GET', ['search' => 'paid', 'status' => 'paid']))
        ->search(fn (Builder $query, string $term) => $query->where('status', $term))
        ->filter('status')
        ->paginate();

    expect($table['pagination']['total'])->toBe(2);
});
