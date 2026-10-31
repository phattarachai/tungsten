<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * @see docs/kernel.md
 */
class Tungsten
{
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
