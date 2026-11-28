<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Concerns\Panel;

use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\Search\GlobalSearch;

/**
 * A {@see Panel}'s topbar global search.
 */
trait HasGlobalSearch
{
    /**
     * @var list<class-string<GlobalSearch>>
     */
    private array $globalSearch = [];

    /**
     * Turns on the topbar's global search over these kinds of records (each a {@see GlobalSearch}); sets add theirs
     * with `searches()`. The search answers at `{path}/search`, behind the panel's auth and gate.
     *
     * @param  list<class-string<GlobalSearch>>  $searches
     */
    public function globalSearch(array $searches): self
    {
        $this->globalSearch = $searches;

        return $this;
    }

    /**
     * The panel's global searches and its sets'.
     *
     * @return list<class-string<GlobalSearch>>
     */
    public function getGlobalSearches(): array
    {
        $fromSets = array_merge(...array_map(fn (string $set): array => $set::searches(), $this->getSets()));

        return array_values(array_unique([...$this->globalSearch, ...$fromSets]));
    }
}
