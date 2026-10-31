<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Phattarachai\Tungsten\Http\Requests\LoginRequest;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;
use Phattarachai\Tungsten\PanelRegistry;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * A panel's own sign-in and sign-out, registered by {@see Panel::login()} at `{path}/login` and `{path}/logout`.
 */
class LoginController
{
    public function __construct(private readonly PanelRegistry $panels) {}

    public function show(Request $request): Response|RedirectResponse
    {
        [$panel, $login] = $this->panelLogin($request);

        $user = Auth::guard($login->guard)->user();

        if ($user !== null && $login->refusal($user, $panel) === null) {
            return redirect()->to($panel->homeUrl());
        }

        return Inertia::render('tungsten::auth/Login', [
            'labels' => $login->labels(),
            'action' => route("{$panel->getId()}.login.attempt"),
            'forgotPasswordUrl' => $login->forgotPasswordUrl(),
        ]);
    }

    public function store(LoginRequest $request): HttpResponse
    {
        [$panel, $login] = $this->panelLogin($request);

        $request->authenticate($panel, $login);
        $request->session()->regenerate();

        return Inertia::location(redirect()->intended($panel->homeUrl())->getTargetUrl());
    }

    public function destroy(Request $request): RedirectResponse
    {
        [$panel, $login] = $this->panelLogin($request);

        Auth::guard($login->guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->to((string) $panel->loginUrl());
    }

    /**
     * @return array{Panel, PanelLogin}
     */
    private function panelLogin(Request $request): array
    {
        $panel = $this->panels->forRoute($request->route()?->getName());
        $login = $panel?->getLogin();

        abort_unless($panel instanceof Panel && $login instanceof PanelLogin, 404);

        return [$panel, $login];
    }
}
