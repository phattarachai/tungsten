<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Phattarachai\Tungsten\Exceptions\MissingPageClass;
use Phattarachai\Tungsten\Http\Middleware\HandleTungstenRequests;
use Phattarachai\Tungsten\Pages\HomePage;
use Symfony\Component\Finder\Finder;

/**
 * One admin panel: its path, chrome, gate, pages and sets. Declared in a {@see PanelProvider} and held by the
 * {@see PanelRegistry}; it resolves its routes, sidebar nav, breadcrumbs and help.
 *
 * @see docs/kernel.md
 */
class Panel
{
    private string $id;

    private string $path;

    private string $label;

    private string $description = '';

    private string $short = '';

    private ?string $icon = null;

    private string $color = '#52525b';

    private ?string $rail = null;

    private ?string $brandColor = null;

    /**
     * @var array{label: string, icon: ?string, tag: ?string}|null
     */
    private ?array $brand = null;

    /**
     * @var (Closure(?string): ?string)|null
     */
    private ?Closure $help = null;

    private bool $business = false;

    private ?string $replaces = null;

    private ?string $ability;

    /**
     * @var list<string>
     */
    private array $middleware = [];

    /**
     * @var list<string>
     */
    private array $navigationGroups = [];

    /**
     * @var list<string>
     */
    private array $pages = [];

    /**
     * @var list<string>
     */
    private array $sets = [];

    /**
     * @var list<array{label: string, url: string, route: ?string, icon: ?string, group: ?string, sort: int, ability: ?string, legacy: bool}>
     */
    private array $links = [];

    private ?Closure $routes = null;

    private string|Closure|false|null $logoutUrl = null;

    private bool $home = true;

    /**
     * @var Collection<int, Page>|null
     */
    private ?Collection $resolved = null;

    /**
     * @var list<string>|null
     */
    private ?array $resolvedSets = null;

    public static function make(string $id): self
    {
        $panel = new self;
        $panel->id = $id;
        $panel->path = $id;
        $panel->label = Str::headline($id);
        $panel->ability = 'access'.Str::studly($id);

        return $panel;
    }

    public function path(string $path): self
    {
        $this->path = trim($path, '/');

        return $this;
    }

    public function label(string $label): self
    {
        $this->label = $label;

        return $this;
    }

    public function description(string $description): self
    {
        $this->description = $description;

        return $this;
    }

    /**
     * The 1–2 letters the switcher chip shows when the panel has no icon.
     */
    public function short(string $short): self
    {
        $this->short = $short;

        return $this;
    }

    public function icon(string $icon): self
    {
        $this->icon = $icon;

        return $this;
    }

    /**
     * The switcher chip's colour.
     */
    public function color(string $color): self
    {
        $this->color = $color;

        return $this;
    }

    /**
     * The sidebar background, a dark tint so panels tell apart at a glance.
     */
    public function rail(string $rail): self
    {
        $this->rail = $rail;

        return $this;
    }

    /**
     * The accent colour (primary buttons, key cells, active marks); `tungsten.brand_color` when unset.
     */
    public function brandColor(string $color): self
    {
        $this->brandColor = $color;

        return $this;
    }

    /**
     * What the sidebar head shows instead of the panel label: an app name, an icon, an optional tag such as "v2".
     */
    public function brand(string $label, ?string $icon = null, ?string $tag = null): self
    {
        $this->brand = ['label' => $label, 'icon' => $icon, 'tag' => $tag];

        return $this;
    }

    /**
     * @param  Closure(?string): ?string  $resolver  route name → help URL
     */
    public function help(Closure $resolver): self
    {
        $this->help = $resolver;

        return $this;
    }

    public function business(bool $business = true): self
    {
        $this->business = $business;

        return $this;
    }

    /**
     * The switcher entry this panel is migrating; the switcher draws it as a chip on that entry's row.
     */
    public function replaces(string $entryId): self
    {
        $this->replaces = $entryId;

        return $this;
    }

    /**
     * The Gate ability every route of the panel is behind; null for none. Defaults to `access{Id}`.
     */
    public function ability(?string $ability): self
    {
        $this->ability = $ability;

        return $this;
    }

    /**
     * Route middleware on top of `tungsten.middleware` (e.g. a feature-flag check).
     *
     * @param  list<string>  $middleware
     */
    public function middleware(array $middleware): self
    {
        $this->middleware = $middleware;

        return $this;
    }

    /**
     * @param  list<string>  $groups
     */
    public function navigationGroups(array $groups): self
    {
        $this->navigationGroups = $groups;

        return $this;
    }

    /**
     * @param  list<class-string<Page>>  $pages
     */
    public function pages(array $pages): self
    {
        $this->pages = [...$this->pages, ...$pages];
        $this->resolved = null;

        return $this;
    }

    /**
     * @param  list<class-string<PanelSet>>  $sets
     */
    public function sets(array $sets): self
    {
        $this->sets = [...$this->sets, ...$sets];
        $this->resolvedSets = null;
        $this->resolved = null;

        return $this;
    }

    /**
     * Every {@see PanelSet} subclass in a directory, e.g. `->discoverSets(app_path('Panel/Sets'), 'App\\Panel\\Sets')`.
     */
    public function discoverSets(string $directory, string $namespace): self
    {
        if (! is_dir($directory)) {
            return $this;
        }

        $sets = collect(Finder::create()->files()->name('*.php')->in($directory)->sortByName())
            ->map(fn (\SplFileInfo $file): string => $namespace.'\\'.str_replace(['/', '.php'], ['\\', ''], Str::after($file->getPathname(), rtrim($directory, '/').'/')))
            ->filter(fn (string $class): bool => is_subclass_of($class, PanelSet::class) && ! new \ReflectionClass($class)->isAbstract())
            ->values()
            ->all();

        return $this->sets($sets);
    }

    /**
     * Sidebar links to screens that are not pages of this panel. A link with `route` is an in-app screen (same
     * tab, marked active like a page); with `url` it opens in a new tab; `legacy` marks a page still on the old
     * admin (same tab, a ↗ and a dot instead of the icon).
     *
     * @param  list<array{label: string, url?: string, route?: string, icon?: ?string, group?: ?string, sort?: int, ability?: ?string, legacy?: bool}>  $links
     */
    public function navigationLinks(array $links): self
    {
        $this->links = [...$this->links, ...array_map(self::link(...), $links)];

        return $this;
    }

    /**
     * Extra (non-page) routes registered inside the panel's prefix, middleware and `{id}.` name prefix.
     * Point them at controllers, not closures, so `route:cache` keeps working.
     */
    public function routes(Closure $routes): self
    {
        $this->routes = $routes;

        return $this;
    }

    /**
     * The sign-out POST target: a route name, a URL, or a closure; false for none. `tungsten.logout_route` when unset.
     */
    public function logoutUrl(string|Closure|false $url): self
    {
        $this->logoutUrl = $url;

        return $this;
    }

    /**
     * Without a page at the panel root, Tungsten mounts a card index of the panel's nav there; false turns it off.
     */
    public function home(bool $home = true): self
    {
        $this->home = $home;

        return $this;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getShort(): string
    {
        return $this->short !== '' ? $this->short : Str::upper(Str::substr($this->label, 0, 1));
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function getColor(): string
    {
        return $this->color;
    }

    public function getRail(): ?string
    {
        return $this->rail;
    }

    public function getBrandColor(): string
    {
        return $this->brandColor ?? (string) config('tungsten.brand_color', '#ba1a1a');
    }

    /**
     * @return array{label: string, icon: ?string, tag: ?string}|null
     */
    public function getBrand(): ?array
    {
        return $this->brand;
    }

    public function isBusiness(): bool
    {
        return $this->business;
    }

    public function getReplaces(): ?string
    {
        return $this->replaces;
    }

    public function getAbility(): ?string
    {
        return $this->ability;
    }

    /**
     * @return list<string>
     */
    public function getSets(): array
    {
        return $this->resolvedSets ??= array_values(array_filter($this->sets, $this->classExists(...)));
    }

    /**
     * @return list<string>
     */
    public function routeMiddleware(): array
    {
        return array_values(array_filter([
            ...(array) config('tungsten.middleware', ['web', 'auth']),
            ...$this->middleware,
            $this->ability === null ? null : "can:{$this->ability}",
            HandleTungstenRequests::class,
        ]));
    }

    public function registerRoutes(): void
    {
        foreach ($this->getSets() as $set) {
            $set::routes();
        }

        $this->routes?->__invoke();
    }

    public function homeUrl(): string
    {
        return url($this->path);
    }

    public function logoutUrlFor(): ?string
    {
        $url = $this->logoutUrl ?? config('tungsten.logout_route');

        if ($url === false) {
            return null;
        }

        return match (true) {
            $url instanceof Closure => $url(),
            ! is_string($url) || $url === '' => null,
            app('router')->has($url) => route($url),
            str_contains($url, '/') => url($url),
            default => null,
        };
    }

    public function helpUrl(?string $routeName): ?string
    {
        if ($this->help instanceof Closure) {
            return ($this->help)($routeName);
        }

        return collect($this->getSets())
            ->flatMap(fn (string $set): array => $set::helpTopics())
            ->first(fn (string $url, string $pattern): bool => Str::is($pattern, (string) $routeName));
    }

    public function routeName(Page $page): string
    {
        return "{$this->id}.{$page->routeKey()}";
    }

    /**
     * Registered page classes that don't exist are skipped and reported, never fatal: one session listing a page
     * it hasn't committed yet must not break every request of the app.
     *
     * @return Collection<int, Page>
     */
    public function resolvePages(): Collection
    {
        if ($this->resolved instanceof Collection) {
            return $this->resolved;
        }

        $classes = collect([...$this->pages, ...collect($this->getSets())->flatMap(fn (string $set): array => $set::pages())])
            ->unique()
            ->filter($this->classExists(...));

        $pages = $classes->map(fn (string $page): Page => app($page))->values();

        return $this->resolved = $this->home && ! $pages->contains(fn (Page $page): bool => trim($page->path(), '/') === '')
            ? $pages->prepend(app(HomePage::class))
            : $pages;
    }

    public function pageForRoute(?string $routeName): ?Page
    {
        return $this->resolvePages()->first(fn (Page $page): bool => $this->routeName($page) === $routeName);
    }

    /**
     * The sidebar tree — pages and links grouped in the declared group order, gate-filtered for the current user,
     * each flagged active against the current request.
     *
     * @return list<array{group: ?string, items: list<array<string, mixed>>}>
     */
    public function navigation(Request $request): array
    {
        $visible = $this->resolvePages()
            ->filter(fn (Page $page): bool => $this->isVisible($page) && $page->showInNavigation())
            ->sortBy(fn (Page $page): int => $page->navSort());

        $groups = collect($this->navigationGroups)
            ->merge($visible->map(fn (Page $page): ?string => $page->navGroup()))
            ->merge(array_column($this->allLinks(), 'group'))
            ->filter()
            ->unique()
            ->all();

        return collect([null, ...$groups])
            ->map(fn (?string $group): array => ['group' => $group, 'items' => $this->itemsForGroup($visible, $group, $request)])
            ->filter(fn (array $section): bool => $section['items'] !== [])
            ->values()
            ->all();
    }

    public function isVisible(Page $page): bool
    {
        return $page->visible() && ($page->ability() === null || Gate::allows($page->ability()));
    }

    /**
     * @return list<string>
     */
    public function missingClasses(): array
    {
        return collect([...$this->sets, ...$this->pages, ...collect($this->getSets())->flatMap(fn (string $set): array => $set::pages())])
            ->reject(fn (string $class): bool => class_exists($class))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Page>  $visible
     * @return list<array<string, mixed>>
     */
    private function itemsForGroup(Collection $visible, ?string $group, Request $request): array
    {
        $pages = $visible
            ->filter(fn (Page $page): bool => $page->navGroup() === $group)
            ->map(fn (Page $page): array => [
                'label' => $page->navLabel(),
                'icon' => $page->navIcon(),
                'url' => route($this->routeName($page)),
                'active' => $request->routeIs($this->routeName($page), "{$this->routeName($page)}.*"),
                'badge' => $page->navBadge(),
                'external' => false,
                'legacy' => false,
                'sort' => $page->navSort(),
            ]);

        $links = collect($this->allLinks())
            ->filter(fn (array $link): bool => $link['group'] === $group)
            ->filter(fn (array $link): bool => $link['ability'] === null || Gate::allows($link['ability']))
            ->map(fn (array $link): array => [
                'label' => $link['label'],
                'icon' => $link['icon'],
                'url' => $link['route'] === null ? url($link['url']) : route($link['route']),
                'active' => $link['route'] !== null && $request->routeIs($link['route'], "{$link['route']}.*"),
                'badge' => null,
                'external' => $link['route'] === null && ! $link['legacy'],
                'legacy' => $link['legacy'],
                'sort' => $link['sort'],
            ]);

        return $pages->concat($links)
            ->sortBy('sort')
            ->map(fn (array $item): array => collect($item)->except('sort')->all())
            ->values()
            ->all();
    }

    /**
     * @return list<array{label: string, url: string, route: ?string, icon: ?string, group: ?string, sort: int, ability: ?string, legacy: bool}>
     */
    private function allLinks(): array
    {
        $fromSets = collect($this->getSets())->flatMap(fn (string $set): array => $set::links())->map(self::link(...))->all();

        return [...$this->links, ...$fromSets];
    }

    /**
     * @param  array{label: string, url?: string, route?: string, icon?: ?string, group?: ?string, sort?: int, ability?: ?string, legacy?: bool}  $link
     * @return array{label: string, url: string, route: ?string, icon: ?string, group: ?string, sort: int, ability: ?string, legacy: bool}
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
        ];
    }

    private function classExists(string $class): bool
    {
        if (class_exists($class)) {
            return true;
        }

        report(new MissingPageClass("Tungsten panel [{$this->id}] lists [{$class}], which does not exist; it was skipped."));

        return false;
    }
}
