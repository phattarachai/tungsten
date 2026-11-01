<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Phattarachai\Tungsten\Exceptions\MissingPageClass;
use Phattarachai\Tungsten\Http\Controllers\GlobalSearchController;
use Phattarachai\Tungsten\Http\Controllers\NotificationController;
use Phattarachai\Tungsten\Http\Controllers\ProfileController;
use Phattarachai\Tungsten\Http\Middleware\AuthenticatePanel;
use Phattarachai\Tungsten\Http\Middleware\HandleTungstenRequests;
use Phattarachai\Tungsten\Search\GlobalSearch;
use Symfony\Component\Finder\Finder;
use WeakMap;

/**
 * One admin panel: its path, chrome, gate and sets. Declared in a {@see PanelProvider} and held by the
 * {@see PanelRegistry}. Its routes are plain Laravel routes; it reads their `->nav()` / `->breadcrumb()` metadata
 * to build the sidebar, breadcrumbs and help.
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

    /**
     * @var array<string, mixed>
     */
    private array $layout = [];

    private ?string $filterLayout = null;

    private ?PanelLogin $login = null;

    /**
     * @var list<class-string<GlobalSearch>>
     */
    private array $globalSearch = [];

    private ?int $notificationPoll = null;

    private ?PanelProfile $profile = null;

    private ?string $brandColor = null;

    /**
     * @var array{label: string, icon: ?string, tag: ?string, logo: ?string}|null
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
    private array $sets = [];

    /**
     * @var list<array{label: string, url: string, route: ?string, icon: ?string, group: ?string, sort: int, ability: ?string, legacy: bool}>
     */
    private array $links = [];

    private ?Closure $routes = null;

    private string|Closure|false|null $logoutUrl = null;

    /**
     * @var list<string>|null
     */
    private ?array $resolvedSets = null;

    /**
     * @var WeakMap<object, array<int, Route>>|null
     */
    private ?WeakMap $navRoutes = null;

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
     * Panel-wide AppLayout defaults (`sheet`, `flush`, `sidebar`, `topbar`, `className`, `mainClassName`); a route's
     * `->layout([...])` overrides them key by key, and a page's JSX props override both.
     *
     * @param  array<string, mixed>  $layout
     */
    public function layout(array $layout): self
    {
        $this->layout = $layout;

        return $this;
    }

    /**
     * The panel's own sign-in page at `{path}/login` (and sign-out at `{path}/logout`), against `$guard` (the default
     * guard when null) and its user provider. Guests on the panel's routes are sent there instead of the app's login.
     * A user must also pass the panel's ability and `$authorize` (false or a message string refuses them).
     *
     * @param  array<string, string>  $labels  overrides for `tungsten.login.labels`
     * @param  (Closure(Authenticatable, Panel): (bool|string|null))|null  $authorize
     */
    public function login(?string $guard = null, array $labels = [], string|Closure|null $forgotPasswordUrl = null, ?Closure $authorize = null): self
    {
        $this->login = new PanelLogin($guard, $labels, $forgotPasswordUrl, $authorize);

        return $this;
    }

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
     * Turns on the topbar's notification bell over the user's Laravel database notifications (the `notifications`
     * table, a `Notifiable` user), refreshed every `$pollSeconds` while the tab is visible.
     */
    public function notifications(int $pollSeconds = 30): self
    {
        $this->notificationPoll = max(5, $pollSeconds);

        return $this;
    }

    /**
     * The signed-in user's own profile page at `{path}/profile`: name, email, password and, when `$avatar` names a
     * column on the user, a photo stored on `$disk`. Linked from the user menu.
     *
     * @param  array<string, string>  $labels  overrides for `tungsten.profile.labels`
     */
    public function profile(?string $avatar = null, string $disk = 'public', array $labels = []): self
    {
        $this->profile = new PanelProfile($avatar, $disk, $labels);

        return $this;
    }

    public function getProfile(): ?PanelProfile
    {
        return $this->profile;
    }

    public function getNotificationPoll(): ?int
    {
        return $this->notificationPoll;
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

    /**
     * How `<Filters>` lays out this panel's list filters, `bar` or `menu`; `tungsten.filter_layout` when unset.
     */
    public function filterLayout(string $layout): self
    {
        throw_unless(in_array($layout, ['bar', 'menu'], true), InvalidArgumentException::class, "Filter layout must be 'bar' or 'menu', got '{$layout}'.");

        $this->filterLayout = $layout;

        return $this;
    }

    /**
     * The accent colour, set inline on the panel's <html>; `tungsten.brand_color` when unset. With neither, the
     * stylesheet's `--color-brand` token applies, so a host can theme it in CSS alone.
     */
    public function brandColor(string $color): self
    {
        $this->brandColor = $color;

        return $this;
    }

    /**
     * What the sidebar head and the login page show instead of the panel label: an app name, an optional tag such as
     * "v2", and the chip's mark: `$logo` (a single-colour SVG, a URL or a public path, drawn white on the panel colour)
     * else `$icon` else the panel's `short` letters.
     */
    public function brand(string $label, ?string $icon = null, ?string $tag = null, ?string $logo = null): self
    {
        $this->brand = ['label' => $label, 'icon' => $icon, 'tag' => $tag, 'logo' => $logo];

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
     * @param  list<class-string<PanelSet>>  $sets
     */
    public function sets(array $sets): self
    {
        $this->sets = [...$this->sets, ...$sets];
        $this->resolvedSets = null;

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
     * Sidebar links to screens that aren't routes of this panel. With `route` it is an in-app screen (same tab,
     * marked active); with `url` it opens in a new tab; `legacy` marks a page still on the old admin.
     *
     * @param  list<array{label: string, url?: string, route?: string, icon?: ?string, group?: ?string, sort?: int, ability?: ?string, legacy?: bool}>  $links
     */
    public function navigationLinks(array $links): self
    {
        $this->links = [...$this->links, ...array_map(self::link(...), $links)];

        return $this;
    }

    /**
     * Routes declared with the panel, inside its prefix, middleware and `{id}.` name prefix. Point them at
     * controllers, not closures, so `route:cache` keeps working. Route files can do the same with
     * `Tungsten::routes('{id}', fn () => ...)`, sets with their `routes()`.
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

    /**
     * @return array<string, mixed>
     */
    public function getLayout(): array
    {
        return $this->layout;
    }

    public function getFilterLayout(): string
    {
        $layout = $this->filterLayout ?? config('tungsten.filter_layout');

        return $layout === 'menu' ? 'menu' : 'bar';
    }

    public function getBrandColor(): ?string
    {
        $color = $this->brandColor ?? config('tungsten.brand_color');

        return is_string($color) && $color !== '' ? $color : null;
    }

    /**
     * The brand with its logo as a URL: a path goes through `asset()`, a full URL or a root path is kept.
     *
     * @return array{label: string, icon: ?string, tag: ?string, logo: ?string}|null
     */
    public function getBrand(): ?array
    {
        $logo = $this->brand['logo'] ?? null;

        if ($this->brand === null || $logo === null || str_starts_with($logo, '/') || str_contains($logo, '://')) {
            return $this->brand;
        }

        return [...$this->brand, 'logo' => asset($logo)];
    }

    public function isBusiness(): bool
    {
        return $this->business;
    }

    public function getReplaces(): ?string
    {
        return $this->replaces;
    }

    public function getLogin(): ?PanelLogin
    {
        return $this->login;
    }

    public function loginUrl(): ?string
    {
        return $this->login === null ? null : route("{$this->id}.login");
    }

    public function getAbility(): ?string
    {
        return $this->ability;
    }

    /**
     * Sets whose class exists; a missing one is skipped and reported, never fatal.
     *
     * @return list<string>
     */
    public function getSets(): array
    {
        return $this->resolvedSets ??= array_values(array_filter($this->sets, $this->setExists(...)));
    }

    /**
     * @return list<string>
     */
    public function missingSets(): array
    {
        return array_values(array_filter($this->sets, fn (string $set): bool => ! class_exists($set)));
    }

    /**
     * @return list<string>
     */
    public function routeMiddleware(): array
    {
        return array_values(array_filter([
            ...$this->withPanelLogin((array) config('tungsten.middleware', ['web', 'auth'])),
            ...$this->middleware,
            $this->ability === null ? null : "can:{$this->ability}",
            HandleTungstenRequests::class,
        ]));
    }

    /**
     * With a panel login, `auth` becomes {@see AuthenticatePanel} (same check, but guests go to the panel's login), on
     * the login's guard when `auth` names none; it is added when the stack has no `auth`.
     *
     * @param  array<int, mixed>  $middleware
     * @return array<int, mixed>
     */
    private function withPanelLogin(array $middleware): array
    {
        if ($this->login === null) {
            return $middleware;
        }

        $guarded = $this->login->guard === null ? AuthenticatePanel::class : AuthenticatePanel::class.":{$this->login->guard}";
        $swapped = array_map(fn (mixed $entry): mixed => match (true) {
            $entry === 'auth' => $guarded,
            is_string($entry) && str_starts_with($entry, 'auth:') => AuthenticatePanel::class.':'.Str::after($entry, 'auth:'),
            default => $entry,
        }, $middleware);

        return $swapped === $middleware ? [...$middleware, $guarded] : $swapped;
    }

    /**
     * The panel's own routes: every set's `routes()`, then `->routes()`. Called inside the panel's route group.
     */
    public function registerRoutes(): void
    {
        if ($this->getGlobalSearches() !== []) {
            app('router')->get('search', GlobalSearchController::class)->name('search');
        }

        if ($this->profile !== null) {
            app('router')->get('profile', [ProfileController::class, 'show'])->name('profile');
            app('router')->put('profile', [ProfileController::class, 'update'])->name('profile.update');
            app('router')->put('profile/password', [ProfileController::class, 'password'])->name('profile.password');
        }

        if ($this->notificationPoll !== null) {
            app('router')->get('notifications', [NotificationController::class, 'index'])->name('notifications');
            app('router')->post('notifications/read', [NotificationController::class, 'readAll'])->name('notifications.read-all');
            app('router')->post('notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
        }

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
        $url = $this->logoutUrl ?? ($this->login === null ? config('tungsten.logout_route') : "{$this->id}.logout");

        return match (true) {
            $url === false => null,
            $url instanceof Closure => $url(),
            ! is_string($url) || $url === '' => null,
            app('router')->has($url) => route($url),
            str_contains($url, '/') => url($url),
            default => null,
        };
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

    public function owns(?Route $route): bool
    {
        return $route !== null && str_starts_with((string) $route->getName(), "{$this->id}.");
    }

    /**
     * The sidebar tree — routes with `->nav()` and the panel's links, grouped in the declared group order, filtered
     * by each route's `can:` middleware and nav ability, each flagged active against the current request.
     *
     * @return list<array{group: ?string, items: list<array<string, mixed>>}>
     */
    public function navigation(Request $request): array
    {
        $items = collect($this->navRoutes())
            ->filter($this->allows(...))
            ->map(fn (Route $route): array => $this->navItem($route, $request))
            ->concat($this->linkItems($request));

        $groups = collect($this->navigationGroups)
            ->merge($items->pluck('group'))
            ->filter()
            ->unique()
            ->all();

        return collect([null, ...$groups])
            ->map(fn (?string $group): array => [
                'group' => $group,
                'items' => $items->where('group', $group)
                    ->sortBy('sort')
                    ->map(fn (array $item): array => collect($item)->except(['sort', 'group'])->all())
                    ->values()
                    ->all(),
            ])
            ->filter(fn (array $section): bool => $section['items'] !== [])
            ->values()
            ->all();
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

        $parent = $this->parentRoute($route, $meta['breadcrumb']['parent'] ?? null);
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
        $nav = RouteMeta::of($route)['nav'];
        $name = (string) $route->getName();

        return [
            'label' => $nav['label'],
            'icon' => $nav['icon'],
            'url' => $this->urlFor($route),
            'active' => $request->routeIs($name, "{$name}.*"),
            'badge' => $this->badge($nav['badge']),
            'external' => false,
            'legacy' => false,
            'group' => $nav['group'],
            'sort' => $nav['sort'],
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
     * @return Collection<int, array{label: string, icon: ?string, url: string, active: bool, badge: null, external: bool, legacy: bool, group: ?string, sort: int}>
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
                'active' => $link['route'] !== null && $request->routeIs($link['route'], "{$link['route']}.*"),
                'badge' => null,
                'external' => $link['route'] === null && ! $link['legacy'],
                'legacy' => $link['legacy'],
                'group' => $link['group'],
                'sort' => $link['sort'],
            ]);
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

    private function setExists(string $class): bool
    {
        if (class_exists($class)) {
            return true;
        }

        report(new MissingPageClass("Tungsten panel [{$this->id}] lists set [{$class}], which does not exist; it was skipped."));

        return false;
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
}
