<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Phattarachai\Tungsten\Auth\AuthSession;
use Phattarachai\Tungsten\Auth\RememberedDevice;
use Phattarachai\Tungsten\Auth\Totp;
use Phattarachai\Tungsten\Contracts\HasTwoFactor;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\PanelTwoFactor;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * `{path}/two-factor-challenge`: the authenticator code (or a recovery code) after the password. It serves two
 * sessions: a correct password waiting to sign in (nobody is signed in yet), and a signed-in user whose session hasn't
 * given a code, such as one who came in through another login on the same guard.
 */
class TwoFactorChallengeController
{
    private const int MAX_ATTEMPTS = 5;

    public function __construct(private readonly PanelRegistry $panels, private readonly Totp $totp) {}

    public function show(Request $request): Response|RedirectResponse
    {
        [$panel, $login] = $this->panelLogin($request);
        $challenged = $this->challenged($request, $panel, $login);

        if ($challenged === null) {
            return $this->nothingToChallenge($request, $panel, $login);
        }

        return Inertia::render('tungsten::auth/TwoFactorChallenge', [
            'labels' => $login->labels(),
            'action' => route("{$panel->getId()}.two-factor.attempt"),
            'loginUrl' => $panel->loginUrl(),
            'logoutUrl' => $challenged['pending'] ? null : route("{$panel->getId()}.logout"),
            'rememberDays' => $login->twoFactor->rememberDays,
        ]);
    }

    public function store(Request $request): HttpResponse
    {
        [$panel, $login] = $this->panelLogin($request);
        $challenged = $this->challenged($request, $panel, $login);

        if ($challenged === null) {
            return $this->nothingToChallenge($request, $panel, $login);
        }

        $request->validate(['code' => ['nullable', 'string'], 'recovery_code' => ['nullable', 'string'], 'remember_device' => ['nullable', 'boolean']]);

        $user = $challenged['user'];
        $key = "tungsten-two-factor|{$panel->getId()}|".AuthSession::id($user);
        $field = $request->filled('recovery_code') ? 'recovery_code' : 'code';

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages([$field => str_replace([':seconds', ':minutes'], [(string) $seconds, (string) ceil($seconds / 60)], $login->label('challengeThrottled'))]);
        }

        if (! $this->passes($request, $user)) {
            RateLimiter::hit($key);

            throw ValidationException::withMessages([$field => $login->label($field === 'code' ? 'invalidCode' : 'invalidRecoveryCode')]);
        }

        RateLimiter::clear($key);
        $session = $request->session();

        if ($challenged['pending']) {
            /** @var StatefulGuard $guard */
            $guard = Auth::guard($login->guard);
            $guard->login($user, $challenged['remember']);
            AuthSession::forgetChallenge($session);
            AuthSession::record($session, $user, ['pwd']);
        }

        $session->regenerate();
        AuthSession::record($session, $user, ['otp']);
        $rememberDays = $login->twoFactor->rememberDays;

        if ($rememberDays > 0 && $request->boolean('remember_device')) {
            RememberedDevice::remember($user, $rememberDays);
        }

        return Inertia::location(redirect()->intended($panel->homeUrl())->getTargetUrl());
    }

    /**
     * An authenticator code, or one of the user's recovery codes (which is then used up).
     */
    private function passes(Request $request, Authenticatable&HasTwoFactor $user): bool
    {
        if (! $request->filled('recovery_code')) {
            $secret = $user->getTwoFactorSecret();

            return $secret !== null && $this->totp->verify($secret, (string) $request->input('code'), AuthSession::id($user));
        }

        $given = strtolower(trim((string) $request->input('recovery_code')));
        $codes = $user->getTwoFactorRecoveryCodes();
        $match = array_find($codes, fn (string $code): bool => hash_equals($code, $given));

        if ($match === null) {
            return false;
        }

        $user->replaceTwoFactorRecoveryCodes(array_values(array_filter($codes, fn (string $code): bool => $code !== $match)));

        return true;
    }

    /**
     * The user this session owes a code for: the waiting sign-in, else the signed-in user when the panel's two-factor
     * says they still owe one.
     *
     * @return array{user: Authenticatable&HasTwoFactor, pending: bool, remember: bool}|null
     */
    private function challenged(Request $request, Panel $panel, PanelLogin $login): ?array
    {
        $session = $request->session();
        $guard = Auth::guard($login->guard);
        $waiting = AuthSession::challenge($session, $panel->getId());

        if ($waiting !== null) {
            $user = method_exists($guard, 'getProvider') ? $guard->getProvider()->retrieveById($waiting['user']) : null;

            return $user instanceof Authenticatable && $user instanceof HasTwoFactor && $user->hasTwoFactorEnabled()
                ? ['user' => $user, 'pending' => true, 'remember' => $waiting['remember']]
                : null;
        }

        $user = $guard->user();

        return $user instanceof Authenticatable && $user instanceof HasTwoFactor && $login->twoFactor?->outstandingStep($user, $session) === PanelTwoFactor::CHALLENGE
            ? ['user' => $user, 'pending' => false, 'remember' => false]
            : null;
    }

    private function nothingToChallenge(Request $request, Panel $panel, PanelLogin $login): RedirectResponse
    {
        AuthSession::forgetChallenge($request->session());

        if (Auth::guard($login->guard)->check()) {
            return redirect()->to($panel->homeUrl());
        }

        return redirect()->to((string) $panel->loginUrl())->with('status', $login->label('challengeExpired'));
    }

    /**
     * @return array{Panel, PanelLogin}
     */
    private function panelLogin(Request $request): array
    {
        $panel = $this->panels->forRoute($request->route()?->getName());
        $login = $panel?->getLogin();

        abort_unless($panel instanceof Panel && $login instanceof PanelLogin && $login->twoFactor !== null, 404);

        return [$panel, $login];
    }
}
