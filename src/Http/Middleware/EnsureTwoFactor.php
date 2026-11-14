<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\PanelTwoFactor;
use Symfony\Component\HttpFoundation\Response;

/**
 * Holds a signed-in user at the panel's two-factor pages until this session has given a code: an enrolled user goes to
 * the challenge, a user who must enrol goes to setup. Every route of a panel with `->login(twoFactor: ...)` runs it;
 * routes outside the panel that sign into the same guard (Filament, Horizon, Log Viewer …) name the panel:
 * `EnsureTwoFactor::for('admin')`.
 */
class EnsureTwoFactor
{
    public function __construct(private readonly PanelRegistry $panels) {}

    /**
     * The middleware string for routes outside a panel: `EnsureTwoFactor::for('admin')`.
     */
    public static function for(string $panel): string
    {
        return static::class.':'.$panel;
    }

    public function handle(Request $request, Closure $next, ?string $panel = null): Response
    {
        $found = $panel === null ? $this->panels->forRoute($request->route()?->getName()) : $this->panels->find($panel);
        $login = $found?->getLogin();
        $twoFactor = $login?->twoFactor;

        if (! $found instanceof Panel || ! $login instanceof PanelLogin || ! $twoFactor instanceof PanelTwoFactor || ! $request->hasSession()) {
            return $next($request);
        }

        $user = Auth::guard($login->guard)->user();
        $step = $user === null ? null : $twoFactor->outstandingStep($user, $request->session());

        if ($step === null) {
            return $next($request);
        }

        return $this->redirect($request, $step === PanelTwoFactor::CHALLENGE
            ? route("{$found->getId()}.two-factor.challenge")
            : route("{$found->getId()}.two-factor.setup"), $login->label('twoFactorRequired'));
    }

    private function redirect(Request $request, string $url, string $message): Response
    {
        return match (true) {
            $request->isMethod('GET') && ! $request->expectsJson() && ! $request->hasHeader('X-Livewire') => redirect()->guest($url),
            $request->hasHeader('X-Inertia') => Inertia::location($url),
            default => abort(403, $message),
        };
    }
}
