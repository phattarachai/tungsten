<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Table;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Contracts\Database\Query\Builder as QueryBuilder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * A server-side list from the query string: whitelisted `?sort=&dir=`, `?search=`, named filters and pagination,
 * shaped for the kit's DataTable (`sort`), SearchInput, filter Dropdown and Pagination (`pagination`).
 *
 *     TableQuery::for(Order::query(), $request)
 *         ->search(['number', 'customer.name'], operator: 'ilike')
 *         ->filter('status', in: OrderStatus::values())
 *         ->filter('type', fn (Builder $query, array $types) => $query->whereIn('order_type_id', $types), multiple: true)
 *         ->sorts(['number', 'created_at', 'total'])
 *         ->defaultSort('created_at', 'desc')
 *         ->paginate(fn (Order $order): array => [...]);
 *
 * @see README.md — "TableQuery"
 */
class TableQuery
{
    /** The value that turns a filter with a default off ("ทั้งหมด"), where an empty value would bring the default back. */
    public const string ALL = 'all';

    /**
     * @var array<string, string>
     */
    private array $sorts = [];

    /**
     * @var array{key: string, dir: string}|null
     */
    private ?array $defaultSort = null;

    /**
     * @var list<string>|Closure|null
     */
    private array|Closure|null $search = null;

    private string $searchOperator = 'like';

    /**
     * @var array<string, array{callback: ?Closure, column: string, multiple: bool, in: ?list<string>, default: mixed}>
     */
    private array $filters = [];

    private int $perPage = 25;

    /**
     * @var list<int>
     */
    private array $perPageOptions = [];

    private ?string $tieBreaker = null;

    private bool $nullsLast = true;

    /**
     * @param  EloquentBuilder|QueryBuilder  $query
     */
    public function __construct(private readonly mixed $query, private readonly Request $request) {}

    /**
     * @param  EloquentBuilder|QueryBuilder  $query
     */
    public static function for(mixed $query, ?Request $request = null): self
    {
        return new self($query, $request ?? request());
    }

    /**
     * Sortable keys. A list sorts by the same-named column; a map is key → column or SQL expression
     * (`'customer' => '(select name from customers where customers.id = orders.customer_id)'`).
     * Only these keys are accepted from `?sort=`.
     *
     * @param  array<int|string, string>  $sorts
     */
    public function sorts(array $sorts): self
    {
        $this->sorts = collect($sorts)
            ->mapWithKeys(fn (string $expression, int|string $key): array => [is_int($key) ? $expression : $key => $expression])
            ->all();

        return $this;
    }

    public function defaultSort(string $key, string $dir = 'asc'): self
    {
        $this->defaultSort = ['key' => $key, 'dir' => $dir === 'desc' ? 'desc' : 'asc'];

        return $this;
    }

    /**
     * Search `?search=` across columns (`relation.column` searches through `whereHas`), or with a closure
     * `fn (Builder $query, string $term)`. PostgreSQL apps pass `operator: 'ilike'` for case-insensitive search.
     *
     * @param  list<string>|Closure  $columns
     */
    public function search(array|Closure $columns, string $operator = 'like'): self
    {
        $this->search = $columns;
        $this->searchOperator = $operator;

        return $this;
    }

    /**
     * A filter read from `?{key}=`. Without a callback it is a `where`/`whereIn` on `column` (the key by default).
     * `in` whitelists values (anything else is ignored); `multiple` reads `?key[]=a&key[]=b` as a list.
     *
     * @param  (Closure(mixed, mixed): mixed)|null  $callback  fn (Builder $query, string|list<string> $value)
     * @param  list<string|int>|null  $in
     */
    public function filter(string $key, ?Closure $callback = null, ?string $column = null, bool $multiple = false, ?array $in = null, mixed $default = null): self
    {
        $this->filters[$key] = [
            'callback' => $callback,
            'column' => $column ?? $key,
            'multiple' => $multiple,
            'in' => $in === null ? null : array_map(strval(...), $in),
            'default' => $default,
        ];

        return $this;
    }

    /**
     * @param  list<int>  $options  values `?per_page=` may pick; empty keeps it fixed
     */
    public function perPage(int $perPage, array $options = []): self
    {
        $this->perPage = $perPage;
        $this->perPageOptions = $options;

        return $this;
    }

    /**
     * A unique column sorted last so pages never repeat or skip rows; the model key by default.
     */
    public function tieBreaker(?string $column): self
    {
        $this->tieBreaker = $column;

        return $this;
    }

    /**
     * Blank values sort last whatever the direction (on by default, like the kit's client-side sort).
     */
    public function nullsLast(bool $nullsLast = true): self
    {
        $this->nullsLast = $nullsLast;

        return $this;
    }

    /**
     * @return array{search: string, sort: ?array{key: string, dir: string}, filters: array<string, mixed>, per_page: int}
     */
    public function state(): array
    {
        return [
            'search' => $this->searchTerm(),
            'sort' => $this->currentSort(),
            'filters' => $this->filterValues(),
            'per_page' => $this->currentPerPage(),
        ];
    }

    /**
     * The query with search, filters and sort applied, for counts or exports.
     *
     * @return EloquentBuilder|QueryBuilder
     */
    public function query(): mixed
    {
        $query = clone $this->query;

        $this->applySearch($query);
        $this->applyFilters($query);
        $this->applySort($query);

        return $query;
    }

    /**
     * @param  (Closure(mixed): mixed)|null  $row  maps each record to the row the page renders
     * @return array{rows: list<mixed>, pagination: array{current_page: int, last_page: int, per_page: int, total: int, from: ?int, to: ?int}, search: string, sort: ?array{key: string, dir: string}, filters: array<string, mixed>, per_page: int}
     */
    public function paginate(?Closure $row = null): array
    {
        /** @var LengthAwarePaginator $paginator */
        $paginator = $this->query()->paginate($this->currentPerPage(), ['*'], 'page', $this->currentPage());

        $rows = collect($paginator->items());

        return [
            'rows' => ($row === null ? $rows : $rows->map($row))->values()->all(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            ...$this->state(),
        ];
    }

    private function searchTerm(): string
    {
        $term = $this->request->query('search');

        return is_string($term) ? Str::limit(trim($term), 200, '') : '';
    }

    /**
     * @return array{key: string, dir: string}|null
     */
    private function currentSort(): ?array
    {
        $key = $this->request->query('sort');

        if (is_string($key) && isset($this->sorts[$key])) {
            return ['key' => $key, 'dir' => $this->request->query('dir') === 'desc' ? 'desc' : 'asc'];
        }

        return $this->defaultSort;
    }

    /**
     * @return array<string, mixed>
     */
    private function filterValues(): array
    {
        return collect($this->filters)->map($this->filterValue(...))->all();
    }

    /**
     * @param  array{callback: ?Closure, column: string, multiple: bool, in: ?list<string>, default: mixed}  $filter
     */
    private function filterValue(array $filter, string $key): mixed
    {
        $raw = $this->request->query($key);

        if ($filter['multiple']) {
            $values = collect(is_array($raw) ? $raw : (is_string($raw) && $raw !== '' ? explode(',', $raw) : []))
                ->filter(fn (mixed $value): bool => is_scalar($value) && (string) $value !== '')
                ->map(strval(...))
                ->filter(fn (string $value): bool => $filter['in'] === null || in_array($value, $filter['in'], true))
                ->unique()
                ->values()
                ->all();

            return $values === [] ? ($filter['default'] ?? []) : $values;
        }

        $value = is_scalar($raw) ? (string) $raw : '';

        if ($value === self::ALL && $filter['default'] !== null) {
            return self::ALL;
        }

        return $value !== '' && ($filter['in'] === null || in_array($value, $filter['in'], true)) ? $value : $filter['default'];
    }

    private function currentPerPage(): int
    {
        $perPage = (int) $this->request->query('per_page');

        return in_array($perPage, $this->perPageOptions, true) ? $perPage : $this->perPage;
    }

    private function currentPage(): int
    {
        $page = filter_var($this->request->query('page'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 1_000_000]]);

        return $page === false ? 1 : $page;
    }

    private function applySearch(mixed $query): void
    {
        $term = $this->searchTerm();

        if ($term === '' || $this->search === null) {
            return;
        }

        if ($this->search instanceof Closure) {
            ($this->search)($query, $term);

            return;
        }

        LikeSearch::apply($query, $this->search, $term, $this->searchOperator);
    }

    private function applyFilters(mixed $query): void
    {
        foreach ($this->filters as $key => $filter) {
            $value = $this->filterValue($filter, $key);

            if ($value === null || $value === '' || $value === [] || $value === self::ALL) {
                continue;
            }

            match (true) {
                $filter['callback'] instanceof Closure => ($filter['callback'])($query, $value),
                is_array($value) => $query->whereIn($filter['column'], $value),
                default => $query->where($filter['column'], $value),
            };
        }
    }

    private function applySort(mixed $query): void
    {
        $sort = $this->currentSort();

        if ($sort !== null && isset($this->sorts[$sort['key']])) {
            $this->orderBy($query, $this->sorts[$sort['key']], $sort['dir']);
        }

        $tieBreaker = $this->tieBreaker ?? ($query instanceof Builder ? $query->getModel()->getQualifiedKeyName() : null);

        if ($tieBreaker !== null) {
            $query->orderBy($tieBreaker, $sort['dir'] ?? 'asc');
        }
    }

    private function orderBy(mixed $query, string $expression, string $dir): void
    {
        $column = preg_match('/^[\w.]+$/', $expression) === 1 ? $query->getGrammar()->wrap($expression) : $expression;

        if (! $this->nullsLast) {
            $query->orderByRaw("{$column} {$dir}");

            return;
        }

        match ($query->getConnection()->getDriverName()) {
            'pgsql', 'sqlite' => $query->orderByRaw("{$column} {$dir} nulls last"),
            default => $query->orderByRaw("({$column}) is null")->orderByRaw("{$column} {$dir}"),
        };
    }
}
