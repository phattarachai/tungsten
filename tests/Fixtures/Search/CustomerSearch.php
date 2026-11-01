<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Search;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Phattarachai\Tungsten\Search\GlobalSearch;
use Phattarachai\Tungsten\Tests\Fixtures\Models\Customer;

/**
 * @extends GlobalSearch<Customer>
 */
class CustomerSearch extends GlobalSearch
{
    public function label(): string
    {
        return 'ลูกค้า';
    }

    public function query(): Builder
    {
        return Customer::query();
    }

    public function attributes(): array
    {
        return ['name'];
    }

    public function title(Model $record): string
    {
        return $record->name;
    }

    public function url(Model $record): string
    {
        return "/admin/customers/{$record->id}";
    }

    public function ability(): ?string
    {
        return 'viewReports';
    }
}
