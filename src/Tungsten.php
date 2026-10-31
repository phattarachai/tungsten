<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Closure;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;

/**
 * @see docs/kernel.md
 */
class Tungsten
{
    /** Each environment's label and status tone; `tungsten.environments` overrides entries, null hides one. */
    public const array ENVIRONMENTS = [
        'production' => null,
        'local' => ['label' => 'Local', 'tone' => 'active'],
        'staging' => ['label' => 'Staging', 'tone' => 'done'],
        'uat' => ['label' => 'UAT', 'tone' => 'todo'],
    ];

    /**
     * The current environment as the panel shows it (switcher, login, tab title), or null to show nothing.
     * Unlisted environments show their own name in the `draft` tone; production shows nothing.
     *
     * @return array{label: string, tone: string}|null
     */
    public static function environment(): ?array
    {
        $name = (string) app()->environment();
        $environments = [...self::ENVIRONMENTS, ...(array) config('tungsten.environments', [])];

        if (! array_key_exists($name, $environments)) {
            return ['label' => $name, 'tone' => 'draft'];
        }

        $environment = $environments[$name];

        return is_array($environment) ? ['label' => (string) $environment['label'], 'tone' => (string) ($environment['tone'] ?? 'draft')] : null;
    }

    /**
     * Declares routes inside a panel — its path prefix, middleware (auth, gate, Tungsten's Inertia middleware) and
     * `{id}.` name prefix. Use it in a route file the way you would `Route::middleware(...)->group(...)`:
     *
     *     Tungsten::routes('admin', function () {
     *         Route::get('/', HomePage::class)->name('dashboard')->nav('หน้าหลัก', icon: 'layout-grid', sort: -1);
     *         Route::get('orders', [OrderController::class, 'index'])->name('orders')->nav('คำสั่งซื้อ', group: 'การขาย');
     *     });
     */
    public static function routes(string $panel, Closure $routes): void
    {
        $found = app(PanelRegistry::class)->find($panel)
            ?? throw new InvalidArgumentException("Tungsten has no panel [{$panel}].");

        Route::prefix($found->getPath())
            ->middleware($found->routeMiddleware())
            ->name("{$found->getId()}.")
            ->group($routes);
    }

    /**
     * The current route's breadcrumb trail ending in `$leaf` — for a page whose last crumb names a record:
     * `'breadcrumbs' => Tungsten::breadcrumbs($order->number)`.
     *
     * @return list<array{label: string, url?: string}>
     */
    public static function breadcrumbs(?string $leaf = null): array
    {
        $route = request()->route();
        $panel = app(PanelRegistry::class)->forRoute($route?->getName());

        if ($panel instanceof Panel) {
            return $panel->breadcrumbs($route, $leaf);
        }

        return $leaf === null ? [] : [['label' => $leaf]];
    }

    /**
     * In bootstrap/app.php: `->withExceptions(fn (Exceptions $exceptions) => Tungsten::handleExceptions($exceptions))`.
     */
    public static function handleExceptions(Exceptions $exceptions): void
    {
        $exceptions->respond(fn (Response $response, \Throwable $e, Request $request): Response => self::errorPage($request, $response));
    }

    /**
     * The panel's Inertia error page for a request under a panel path, else the response untouched. It renders
     * without the shell, because a 403 from the gate aborts before the panel's shared props exist.
     */
    public static function errorPage(Request $request, Response $response): Response
    {
        $status = $response->getStatusCode();
        $panel = self::panelForPath($request);

        if (! $panel instanceof Panel || ! self::rendersError($request, $status)) {
            return $response;
        }

        Inertia::setRootView('tungsten::app');
        View::share('tungstenPanel', $panel);

        return Inertia::render('tungsten::errors/Error', ['status' => $status, 'home' => $panel->homeUrl()])
            ->toResponse($request)
            ->setStatusCode($status);
    }

    private static function panelForPath(Request $request): ?Panel
    {
        return collect(app(PanelRegistry::class)->all())
            ->sortByDesc(fn (Panel $panel): int => strlen($panel->getPath()))
            ->first(fn (Panel $panel): bool => $panel->getPath() === '' || $request->is($panel->getPath(), "{$panel->getPath()}/*"));
    }

    private static function rendersError(Request $request, int $status): bool
    {
        return ! $request->expectsJson()
            && in_array($status, (array) config('tungsten.error_statuses', []), true)
            && ($status !== 500 || ! config('app.debug'));
    }
}
