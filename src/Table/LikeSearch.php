<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Table;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/**
 * `term` matched anywhere in any of `columns` (`relation.column` through `whereHas`), with LIKE's `%` and `_` escaped.
 * Shared by TableQuery's `?search=` and the panel's global search.
 */
final class LikeSearch
{
    /**
     * @param  list<string>  $columns
     */
    public static function apply(mixed $query, array $columns, string $term, string $operator = 'like'): void
    {
        $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $term).'%';

        $query->where(function (mixed $query) use ($columns, $like, $operator): void {
            foreach ($columns as $column) {
                self::orWhereLike($query, $column, $like, $operator);
            }
        });
    }

    private static function orWhereLike(mixed $query, string $column, string $like, string $operator): void
    {
        if (str_contains($column, '.') && $query instanceof Builder) {
            $query->orWhereHas(Str::beforeLast($column, '.'), fn (mixed $related) => self::whereLike($related, Str::afterLast($column, '.'), $like, $operator));

            return;
        }

        $query->orWhere(fn (mixed $query) => self::whereLike($query, $column, $like, $operator));
    }

    /**
     * SQLite has no default LIKE escape character, so it gets an explicit `escape '\'`.
     */
    private static function whereLike(mixed $query, string $column, string $like, string $operator): void
    {
        if ($query->getConnection()->getDriverName() === 'sqlite') {
            $query->whereRaw("{$query->getGrammar()->wrap($column)} like ? escape '\\'", [$like]);

            return;
        }

        $query->where($column, $operator, $like);
    }
}
