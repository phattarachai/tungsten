<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Phattarachai\Tungsten\Auth\AuthSession;
use Phattarachai\Tungsten\Auth\Totp;
use Phattarachai\Tungsten\Contracts\HasTwoFactor;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\PanelTwoFactor;

/**
 * Two-factor on the profile page (a panel with both `->profile()` and `->login(twoFactor: ...)`): new recovery codes,
 * and turning it off for a user who isn't required to use it. Enrolling and moving to a new phone go through
 * {@see TwoFactorSetupController}.
 */
class TwoFactorProfileController
{
    public function __construct(private readonly PanelRegistry $panels, private readonly Totp $totp) {}

    public function regenerate(Request $request): RedirectResponse
    {
        $this->panelLogin($request);
        $user = $this->user($request);

        abort_unless($user->hasTwoFactorEnabled(), 404);

        $codes = $this->totp->recoveryCodes();
        $user->replaceTwoFactorRecoveryCodes($codes);

        return back()
            ->with(AuthSession::RECOVERY_CODES, $codes)
            ->with('flash', ['message' => $this->profileLabel($request, 'codesRegenerated'), 'tone' => 'success']);
    }

    public function destroy(Request $request): RedirectResponse
    {
        [, $login, $twoFactor] = $this->panelLogin($request);
        $user = $this->user($request);

        $request->validate(['current_password' => ['required', 'string', 'current_password'.($login->guard === null ? '' : ":{$login->guard}")]]);

        if ($twoFactor->requiredFor($user)) {
            throw ValidationException::withMessages(['current_password' => $this->profileLabel($request, 'twoFactorRequiredNote')]);
        }

        $user->disableTwoFactor();

        return back()->with('flash', ['message' => $this->profileLabel($request, 'twoFactorDisabled'), 'tone' => 'success']);
    }

    private function profileLabel(Request $request, string $key): string
    {
        $panel = $this->panels->forRoute($request->route()?->getName());

        return $panel?->getProfile()?->labels()[$key] ?? $key;
    }

    private function user(Request $request): HasTwoFactor&Authenticatable
    {
        $user = $request->user();

        abort_unless($user instanceof HasTwoFactor, 404);

        return $user;
    }

    /**
     * @return array{Panel, PanelLogin, PanelTwoFactor}
     */
    private function panelLogin(Request $request): array
    {
        $panel = $this->panels->forRoute($request->route()?->getName());
        $login = $panel?->getLogin();
        $twoFactor = $login?->twoFactor;

        abort_unless($panel instanceof Panel && $login instanceof PanelLogin && $twoFactor instanceof PanelTwoFactor && $panel->getProfile() !== null, 404);

        return [$panel, $login, $twoFactor];
    }
}
