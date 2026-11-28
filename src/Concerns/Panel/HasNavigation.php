<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Concerns\Panel;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\RouteMeta;
use WeakMap;

/**
 * A {@see Panel}'s sidebar, breadcrumbs and help links, read from its routes' `->nav()` / `->breadcrumb()` metadata.
 */
trait HasNavigation
{
    /**
     * @var list<string>
     */
    private array $navigationGroups = [];

    /**
     * Groups folded until the user opens them.
     *
     * @var list<string>
     */
    private array $collapsedGroups = [];

    /**
     * @var list<array{label: string, url: string, route: ?string, icon: ?string, group: ?string, sort: int, ability: ?string, legacy: bool, pinned: ?string}>
     */
    private array $links = [];

    /**
     * @var (Closure(?string): ?string)|null
     */
    private ?Closure $help = null;

    /**
     * @var WeakMap<object, array<int, Route>>|null
     */
    private ?WeakMap $navRoutes = null;

    /**
     * @param  Closure(?string): ?string  $resolver  route name → help URL
     */
    public function help(Closure $resolver): self
    {
        $this->help = $resolver;

        return $this;
    }

    /**
     * The sidebar's group order; a group with options folds by default: `['การขาย', 'การตลาด' => ['collapsed' => true]]`.
     * The user's own open / closed choice per group is remembered in the browser, and a folded group opens on its own
     * while it holds the active page.
     *
     * @param  array<int|string, string|array{collapsed?: bool}>  $groups
     */
    public function navigationGroups(array $groups): self
    {
        $this->navigationGroups = [];
        $this->collapsedGroups = [];

        foreach ($groups as $key => $value) {
            $name = is_int($key) ? (string) $value : $key;
            $this->navigationGroups[] = $name;

            if (is_array($value) && ($value['collapsed'] ?? false)) {
                $this->collapsedGroups[] = $name;
            }
        }

        return $this;
    }

    /**
     * Sidebar links to screens that aren't routes of this panel. With `route` it is an in-app screen (same tab,
     * marked active); with `url` it opens in a new tab; `legacy` marks a page still on the old admin.
     *
     * @param  list<array{label: string, url?: string, route?: string, icon?: ?string, group?: ?string, sort?: int, ability?: ?string, legacy?: bool, pinned?: ?string}>  $links
     */
    public function navigationLinks(array $links): self
    {
        $this->links = [...$this->links, ...array_map(self::link(...), $links)];

        return $this;
    }

    public function helpUrl(?Route $route): ?string
    {
        $routeName = $route?->getName();
        $meta = RouteMeta::of($route);

        if (isset($meta['help'])) {
            return $meta['help'];
        }

        if ($this->help instanceof Closure) {
            return ($this->help)($routeName);
        }

        return collect($this->getSets())
            ->flatMap(fn (string $set): array => $set::helpTopics())
            ->first(fn (string $url, string $pattern): bool => Str::is($pattern, (string) $routeName));
    }

    /**
     * The sidebar tree — routes with `->nav()` and the panel's links, grouped in the declared group order, filtered
     * by each route's `can:` middleware and nav ability, each flagged active against the current request.
     *
     * Ungrouped entries come first, with no heading. A group from `navigationGroups()` with `collapsed` is flagged so
     * the sidebar folds it until the user opens it. Entries with `pinned: 'bottom'` leave their group for a last
     * section (`pinned: 'bottom'`), drawn at the sidebar's foot.
     *
     * @return list<array{group: ?string, collapsed: bool, pinned: ?string, items: list<array<string, mixed>>}>
     */
    public function navigation(Request $request): array
    {
        $items = collect($this->navRoutes())
            ->filter($this->allows(...))
            ->map(fn (Route $route): array => $this->navItem($route, $request))
            ->concat($this->linkItems($request));
        [$bottom, $listed] = $items->partition(fn (array $item): bool => $item['pinned'] === 'bottom');

        $groups = collect($this->navigationGroups)
            ->merge($listed->pluck('group'))
            ->filter()
            ->unique()
            ->all();

        $sections = array_map(fn (?string $group): array => [
            'group' => $group,
            'collapsed' => in_array($group, $this->collapsedGroups, true),
            'pinned' => null,
            'items' => $this->sectionItems($listed->where('group', $group)),
        ], [null, ...$groups]);
        $sections[] = ['group' => null, 'collapsed' => false, 'pinned' => 'bottom', 'items' => $this->sectionItems($bottom)];

        return array_values(array_filter($sections, fn (array $section): bool => $section['items'] !== []));
    }

    /**
     * The trail for the current route: its `->breadcrumbs([...])` if set; for a nav route, its group and label; else
     * the parent nav route (`->breadcrumb(parent:)`, or the longest nav route name that prefixes this one) as a link,
     * then the route's own `->breadcrumb('…')` label or `$leaf`.
     *
     * @return list<array{label: string, url?: string}>
     */
    public function breadcrumbs(?Route $route, ?string $leaf = null): array
    {
        $meta = RouteMeta::of($route);

        if (isset($meta['breadcrumbs']) && $leaf === null) {
            return array_map(self::crumb(...), $meta['breadcrumbs']);
        }

        if (isset($meta['nav']) && $leaf === null) {
            return array_values(array_filter([
                $meta['nav']['group'] === null ? null : ['label' => $meta['nav']['group']],
                ['label' => $meta['nav']['label']],
            ]));
        }

        $parent = $this->parentRoute($route, $meta['breadcrumb']['parent'] ?? $meta['navParent'] ?? null);
        $parentNav = RouteMeta::of($parent)['nav'] ?? null;
        $label = $leaf ?? $meta['breadcrumb']['label'] ?? null;

        return array_values(array_filter([
            $parentNav === null || $parentNav['group'] === null ? null : ['label' => $parentNav['group']],
            $parentNav === null || $parent === null ? null : ['label' => $parentNav['label'], 'url' => $this->urlFor($parent, $route)],
            $label === null ? null : ['label' => $label],
        ]));
    }

    /**
     * @return array<int, Route>
     */
    public function navRoutes(): array
    {
        $routes = app('router')->getRoutes();
        $this->navRoutes ??= new WeakMap;

        return $this->navRoutes[$routes] ??= collect($routes->getRoutes())
            ->filter(fn (Route $route): bool => $this->owns($route) && isset(RouteMeta::of($route)['nav']) && in_array('GET', $route->methods(), true))
            ->reject(fn (Route $route): bool => preg_match('/\{\w+\}/', $route->uri()) === 1)
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function sectionItems(Collection $items): array
    {
        return $items->sortBy('sort')
            ->map(fn (array $item): array => collect($item)->except(['sort', 'group', 'pinned'])->all())
            ->values()
            ->all();
    }

    private function allows(Route $route): bool
    {
        $abilities = collect($route->middleware())
            ->filter(fn (string $middleware): bool => str_starts_with($middleware, 'can:') && ! str_contains($middleware, ','))
            ->map(fn (string $middleware): string => Str::after($middleware, 'can:'))
            ->reject(fn (string $ability): bool => $ability === $this->ability)
            ->push(RouteMeta::of($route)['nav']['ability'] ?? null)
            ->filter();

        return $abilities->every(fn (string $ability): bool => Gate::allows($ability));
    }

    /**
     * @return array<string, mixed>
     */
    private function navItem(Route $route, Request $request): array
    {
        $meta = RouteMeta::of($route);
        $nav = $meta['nav'];
        $name = (string) $route->getName();

        return [
            'label' => $nav['label'],
            'icon' => $nav['icon'],
            'url' => $this->urlFor($route),
            'active' => $request->routeIs($name, "{$name}.*", ...($meta['activeFor'] ?? [])) || $this->isNavParent($request, $name),
            'badge' => $this->badge($nav['badge']),
            'external' => false,
            'legacy' => false,
            'group' => $nav['group'],
            'sort' => $nav['sort'],
            'pinned' => $nav['pinned'] ?? null,
        ];
    }

    /**
     * A badge is a fixed string, or the class name of an invokable that returns one (counts, states).
     */
    private function badge(?string $badge): ?string
    {
        if ($badge === null || ! class_exists($badge)) {
            return $badge;
        }

        $value = app($badge)();

        return $value === null ? null : (string) $value;
    }

    /**
     * @return Collection<int, array{label: string, icon: ?string, url: string, active: bool, badge: null, external: bool, legacy: bool, group: ?string, sort: int, pinned: ?string}>
     */
    private function linkItems(Request $request): Collection
    {
        $fromSets = collect($this->getSets())->flatMap(fn (string $set): array => $set::links())->map(self::link(...));

        return collect($this->links)
            ->concat($fromSets)
            ->filter(fn (array $link): bool => $link['ability'] === null || Gate::allows($link['ability']))
            ->map(fn (array $link): array => [
                'label' => $link['label'],
                'icon' => $link['icon'],
                'url' => $link['route'] === null ? url($link['url']) : route($link['route']),
                'active' => $link['route'] !== null && ($request->routeIs($link['route'], "{$link['route']}.*") || $this->isNavParent($request, $link['route'])),
                'badge' => null,
                'external' => $link['route'] === null && ! $link['legacy'],
                'legacy' => $link['legacy'],
                'group' => $link['group'],
                'sort' => $link['sort'],
                'pinned' => $link['pinned'],
            ]);
    }

    /** Whether the open route names `$name` as its `->navParent()`. */
    private function isNavParent(Request $request, string $name): bool
    {
        $current = $request->route();

        return $current instanceof Route && (RouteMeta::of($current)['navParent'] ?? null) === $name;
    }

    private function parentRoute(?Route $route, ?string $parent): ?Route
    {
        if ($parent !== null) {
            return app('router')->getRoutes()->getByName($parent);
        }

        $name = (string) $route?->getName();

        return collect($this->navRoutes())
            ->filter(fn (Route $candidate): bool => $candidate->getName() !== $name && str_starts_with($name, "{$candidate->getName()}."))
            ->sortByDesc(fn (Route $candidate): int => strlen((string) $candidate->getName()))
            ->first();
    }

    /**
     * A route's URL, filling its parameters from the current route's (a parent of `orders.items.show` is
     * `orders.show`, which needs the same `{order}`).
     */
    private function urlFor(Route $route, ?Route $current = null): string
    {
        $parameters = array_intersect_key($current?->parameters() ?? [], array_flip($route->parameterNames()));

        return route((string) $route->getName(), $parameters);
    }

    /**
     * @param  array{label: string, url?: string, route?: string}  $crumb
     * @return array{label: string, url?: string}
     */
    private static function crumb(array $crumb): array
    {
        return match (true) {
            isset($crumb['route']) => ['label' => $crumb['label'], 'url' => route($crumb['route'])],
            isset($crumb['url']) => ['label' => $crumb['label'], 'url' => url($crumb['url'])],
            default => ['label' => $crumb['label']],
        };
    }

    /**
     * @param  array{label: string, url?: string, route?: string, icon?: ?string, group?: ?string, sort?: int, ability?: ?string, legacy?: bool, pinned?: ?string}  $link
     * @return array{label: string, url: string, route: ?string, icon: ?string, group: ?string, sort: int, ability: ?string, legacy: bool, pinned: ?string}
     */
    private static function link(array $link): array
    {
        return [
            'label' => $link['label'],
            'url' => $link['url'] ?? '',
            'route' => $link['route'] ?? null,
            'icon' => $link['icon'] ?? null,
            'group' => $link['group'] ?? null,
            'sort' => $link['sort'] ?? 0,
            'ability' => $link['ability'] ?? null,
            'legacy' => $link['legacy'] ?? false,
            'pinned' => $link['pinned'] ?? null,
        ];
    }
}
