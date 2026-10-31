<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\View;
use Inertia\Middleware;
use Override;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\RouteMeta;
use Symfony\Component\HttpFoundation\Response;

/**
 * The panel's own Inertia middleware: its root view (not the app's `HandleInertiaRequests` one) and the shared
 * props every page reads through `usePage()` — auth, panel, switcher, nav, breadcrumbs and flash.
 *
 * @see docs/kernel.md
 */
class HandleTungstenRequests extends Middleware
{
    protected $rootView = 'tungsten::app';

    public function __construct(private readonly PanelRegistry $panels) {}

    #[Override]
    public function handle(Request $request, Closure $next): Response
    {
        $panel = $this->panels->forRoute($request->route()?->getName());

        abort_unless($panel instanceof Panel, 404);

        View::share('tungstenPanel', $panel);

        return parent::handle($request, $next);
    }

    /**
     * @return array<string, mixed>
     */
    #[Override]
    public function share(Request $request): array
    {
        $route = $request->route();
        $panel = $this->panels->forRoute($route?->getName());

        abort_unless($panel instanceof Panel, 404);

        return [
            ...parent::share($request),
            'auth' => fn (): array => $this->auth($request, $panel),
            'panel' => fn (): array => $this->panel($panel, $route),
            'panels' => fn (): array => $this->panels->switcherFor($request->user(), $panel->getId()),
            'nav' => fn (): array => $panel->navigation($request),
            'breadcrumbs' => fn (): array => $panel->breadcrumbs($route),
            'layout' => fn (): ?array => RouteMeta::of($route)['layout'] ?? null,
            'flash' => fn (): array => [
                'message' => $request->hasSession() ? $request->session()->get('flash') : null,
                'status' => $request->hasSession() ? $request->session()->get('status') : null,
            ],
        ];
    }

    /**
     * @return array{user: ?array{id: mixed, name: ?string, email: ?string}, logoutUrl: ?string}
     */
    private function auth(Request $request, Panel $panel): array
    {
        $user = $request->user();

        return [
            'user' => $user === null ? null : [
                'id' => $user->getAuthIdentifier(),
                'name' => $user->name ?? null,
                'email' => $user->email ?? null,
            ],
            'logoutUrl' => $panel->logoutUrlFor(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function panel(Panel $panel, ?Route $route): array
    {
        return [
            'id' => $panel->getId(),
            'label' => $panel->getLabel(),
            'short' => $panel->getShort(),
            'icon' => $panel->getIcon(),
            'color' => $panel->getColor(),
            'rail' => $panel->getRail(),
            'brand' => $panel->getBrand(),
            'help' => $panel->helpUrl($route),
            'home' => $panel->homeUrl(),
            'environment' => app()->environment(),
        ];
    }
}
