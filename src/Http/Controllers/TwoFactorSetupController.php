<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Phattarachai\Tungsten\Auth\AuthSession;
use Phattarachai\Tungsten\Auth\Totp;
use Phattarachai\Tungsten\Contracts\HasTwoFactor;
use Phattarachai\Tungsten\Http\Middleware\EnsureTwoFactor;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\PanelTwoFactor;

/**
 * `{path}/two-factor/setup`: enrol an authenticator app (QR, then a code to confirm it), then see the recovery codes
 * once. A user who must use two-factor lands here from {@see EnsureTwoFactor}
 * at their first sign-in; `?renew=1` (from the profile) moves an enrolled user to a new phone once this session has
 * given a code.
 */
class TwoFactorSetupController
{
    private const int MAX_ATTEMPTS = 5;

    public function __construct(private readonly PanelRegistry $panels, private readonly Totp $totp) {}

    public function show(Request $request): Response|RedirectResponse
    {
        [$panel, $login, $twoFactor] = $this->panelLogin($request);
        $user = $this->user($request, $login);
        $session = $request->session();
        $codes = $session->get(AuthSession::RECOVERY_CODES);

        if (is_array($codes) && $codes !== []) {
            return Inertia::render('tungsten::auth/TwoFactorSetup', [
                'labels' => $login->labels(),
                'recoveryCodes' => array_values($codes),
                'continueUrl' => $session->pull('url.intended', $this->afterUrl($panel)),
            ]);
        }

        if ($redirect = $this->blocked($request, $panel, $twoFactor, $user)) {
            return $redirect;
        }

        $secret = AuthSession::setupSecret($session, $user, $this->totp->generateSecret(...));

        return Inertia::render('tungsten::auth/TwoFactorSetup', [
            'labels' => $login->labels(),
            'renew' => $user->hasTwoFactorEnabled(),
            'required' => $twoFactor->requiredFor($user),
            'qr' => $this->totp->qrSvg($user->getTwoFactorLabel(), $secret),
            'secret' => trim(chunk_split($secret, 4, ' ')),
            'action' => route("{$panel->getId()}.two-factor.confirm"),
            'logoutUrl' => route("{$panel->getId()}.logout"),
            'cancelUrl' => $user->hasTwoFactorEnabled() || ! $twoFactor->requiredFor($user) ? $this->afterUrl($panel) : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        [$panel, $login, $twoFactor] = $this->panelLogin($request);
        $user = $this->user($request, $login);
        $session = $request->session();

        if ($redirect = $this->blocked($request, $panel, $twoFactor, $user)) {
            return $redirect;
        }

        $request->validate(['code' => ['required', 'string']]);

        $secret = AuthSession::pendingSetupSecret($session, $user);
        $key = "tungsten-two-factor-setup|{$panel->getId()}|".AuthSession::id($user);

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages(['code' => str_replace([':seconds', ':minutes'], [(string) $seconds, (string) ceil($seconds / 60)], $login->label('challengeThrottled'))]);
        }

        if ($secret === null || ! $this->totp->verify($secret, (string) $request->input('code'), AuthSession::id($user))) {
            RateLimiter::hit($key);

            throw ValidationException::withMessages(['code' => $login->label('invalidCode')]);
        }

        RateLimiter::clear($key);

        $codes = $this->totp->recoveryCodes();
        $user->enableTwoFactor($secret, $codes);
        AuthSession::forgetSetup($session);
        $session->regenerate();
        AuthSession::record($session, $user, ['otp']);
        $session->flash(AuthSession::RECOVERY_CODES, $codes);

        return redirect()->route("{$panel->getId()}.two-factor.setup");
    }

    /**
     * An enrolled user who hasn't given a code this session goes to the challenge first (re-enrolling must not get
     * round it). Enrolling ties a phone to the account, so it also needs the password typed in this session: a session
     * restored from a remember-me cookie, or one signed in elsewhere (Filament's own form), is signed out and sent to
     * the panel's login. An enrolled user who didn't ask to renew has nothing to set up.
     */
    private function blocked(Request $request, Panel $panel, PanelTwoFactor $twoFactor, HasTwoFactor&Authenticatable $user): ?RedirectResponse
    {
        $session = $request->session();

        if ($user->hasTwoFactorEnabled() && $twoFactor->outstandingStep($user, $session) === PanelTwoFactor::CHALLENGE) {
            return redirect()->route("{$panel->getId()}.two-factor.challenge");
        }

        if (! AuthSession::passed($session, $user, 'pwd')) {
            $login = $panel->getLogin();

            Auth::guard($login?->guard)->logout();
            $session->invalidate();
            $session->regenerateToken();

            return redirect()->to((string) $panel->loginUrl())->with('status', $login?->label('setupNeedsPassword'));
        }

        if (! $user->hasTwoFactorEnabled()) {
            return null;
        }

        return $request->boolean('renew') || $request->isMethod('POST') ? null : redirect()->to($this->afterUrl($panel));
    }

    private function afterUrl(Panel $panel): string
    {
        return $panel->getProfile() === null ? $panel->homeUrl() : route("{$panel->getId()}.profile");
    }

    private function user(Request $request, PanelLogin $login): HasTwoFactor&Authenticatable
    {
        $user = Auth::guard($login->guard)->user();

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

        abort_unless($panel instanceof Panel && $login instanceof PanelLogin && $twoFactor instanceof PanelTwoFactor, 404);

        return [$panel, $login, $twoFactor];
    }
}
