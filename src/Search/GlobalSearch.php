<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Search;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One kind of record the panel's global search finds (Filament's globally searchable resource). Register it with
 * `Panel::globalSearch([...])` or a set's `searches()`. The topbar search sends the term here; each class answers
 * with up to `limit()` results under its `label()`.
 *
 *     class CustomerSearch extends GlobalSearch
 *     {
 *         public function label(): string { return 'ลูกค้า'; }
 *         public function query(): Builder { return Customer::query(); }
 *         public function attributes(): array { return ['name', 'phone', 'email', 'company.name']; }
 *         public function title(Model $record): string { return $record->name; }
 *         public function details(Model $record): array { return ['เบอร์โทร' => $record->phone]; }
 *         public function url(Model $record): string { return route('admin.customers.show', $record); }
 *     }
 *
 * @template TModel of Model
 */
abstract class GlobalSearch
{
    /** The group heading over this kind's results. */
    abstract public function label(): string;

    /**
     * The records to search: a model's query with any scope or eager load the results need.
     *
     * @return Builder<TModel>
     */
    abstract public function query(): Builder;

    /**
     * Columns the term is matched in, anywhere in the value; `relation.column` searches a relation.
     *
     * @return list<string>
     */
    abstract public function attributes(): array;

    /** @param  TModel  $record */
    abstract public function title(Model $record): string;

    /** @param  TModel  $record */
    abstract public function url(Model $record): string;

    /**
     * A line of label => value facts under the title; empty values are left out.
     *
     * @param  TModel  $record
     * @return array<string, mixed>
     */
    public function details(Model $record): array
    {
        return [];
    }

    /**
     * A thumbnail or avatar URL shown before the title.
     *
     * @param  TModel  $record
     */
    public function image(Model $record): ?string
    {
        return null;
    }

    /** A named icon beside this kind's results in the launchpad (as in `->nav(icon:)`); null for a plain dot. */
    public function icon(): ?string
    {
        return null;
    }

    /** The gate a user must pass to see these results; null for anyone in the panel. */
    public function ability(): ?string
    {
        return null;
    }

    public function limit(): int
    {
        return 5;
    }

    /** `ilike` on PostgreSQL for case-insensitive matching. */
    public function operator(): string
    {
        return 'like';
    }
}
