<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Phattarachai\Tungsten\Http\Requests\GlobalSearchRequest;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\Search\GlobalSearch;
use Phattarachai\Tungsten\Table\LikeSearch;

/**
 * The topbar's global search: each of the panel's {@see GlobalSearch} kinds the user may see, matched on its
 * attributes, as `{ groups: [{ label, results: [{ title, url, details, image }] }] }`. Kinds with no match are left out.
 */
class GlobalSearchController
{
    public function __construct(private readonly PanelRegistry $panels) {}

    public function __invoke(GlobalSearchRequest $request): JsonResponse
    {
        $panel = $this->panels->forRoute($request->route()?->getName());

        abort_unless($panel instanceof Panel, 404);

        $groups = collect($panel->getGlobalSearches())
            ->map(fn (string $class): GlobalSearch => app($class))
            ->filter(fn (GlobalSearch $search): bool => $search->ability() === null || Gate::allows($search->ability()))
            ->map(fn (GlobalSearch $search): array => ['label' => $search->label(), 'results' => $this->results($search, $request->term())])
            ->filter(fn (array $group): bool => $group['results'] !== [])
            ->values()
            ->all();

        return response()->json(['groups' => $groups]);
    }

    /**
     * @return list<array{title: string, url: string, details: list<array{label: string, value: string}>, image: ?string}>
     */
    private function results(GlobalSearch $search, string $term): array
    {
        $query = $search->query();

        LikeSearch::apply($query, $search->attributes(), $term, $search->operator());

        return $query->limit($search->limit())->get()
            ->map(fn (Model $record): array => [
                'title' => $search->title($record),
                'url' => $search->url($record),
                'details' => $this->details($search->details($record)),
                'image' => $search->image($record),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $details
     * @return list<array{label: string, value: string}>
     */
    private function details(array $details): array
    {
        return collect($details)
            ->reject(fn (mixed $value): bool => $value === null || $value === '')
            ->map(fn (mixed $value, string $label): array => ['label' => $label, 'value' => (string) $value])
            ->values()
            ->all();
    }
}
