<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Phattarachai\Tungsten\Auth\PanelPasswordReset;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;
use Phattarachai\Tungsten\PanelRegistry;

/**
 * A panel's forgot / reset password pages, registered by `->login(passwordReset: true)` at `{path}/forgot-password`
 * and `{path}/reset-password/{token}`. The forgot page says the same thing whether or not the email has an account.
 */
class PasswordResetController
{
    private const int MAX_ATTEMPTS = 5;

    public function __construct(private readonly PanelRegistry $panels) {}

    public function request(Request $request): Response
    {
        [$panel, $login] = $this->panelLogin($request);

        return Inertia::render('tungsten::auth/ForgotPassword', [
            'labels' => $login->labels(),
            'action' => route("{$panel->getId()}.password.email"),
            'loginUrl' => $panel->loginUrl(),
        ]);
    }

    public function email(Request $request): RedirectResponse
    {
        [$panel, $login] = $this->panelLogin($request);

        $email = Str::lower(trim((string) $request->input('email')));
        $request->merge(['email' => $email]);
        $request->validate(['email' => ['required', 'string', 'email']]);

        $this->throttle($request, 'forgot', $login);

        new PanelPasswordReset($panel)->sendLink(['email' => $email]);

        return back()->with('status', $login->label('linkSent'));
    }

    public function edit(Request $request, string $token): Response
    {
        [$panel, $login] = $this->panelLogin($request);

        return Inertia::render('tungsten::auth/ResetPassword', [
            'labels' => $login->labels(),
            'action' => route("{$panel->getId()}.password.update"),
            'token' => $token,
            'email' => (string) $request->query('email', ''),
            'forgotUrl' => route("{$panel->getId()}.password.request"),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        [$panel, $login] = $this->panelLogin($request);

        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'confirmed', PasswordRule::defaults()],
        ]);

        $this->throttle($request, 'reset', $login);

        $status = new PanelPasswordReset($panel)->reset([
            'email' => $data['email'],
            'token' => $data['token'],
            'password' => $data['password'],
            'password_confirmation' => (string) $request->input('password_confirmation'),
        ]);

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => $login->label('resetInvalid')]);
        }

        RateLimiter::clear($this->throttleKey($request, 'reset'));

        return redirect()->to((string) $panel->loginUrl())->with('status', $login->label('passwordReset'));
    }

    /**
     * Five tries a minute per IP for each form; every try counts.
     *
     * @throws ValidationException
     */
    private function throttle(Request $request, string $form, PanelLogin $login): void
    {
        $key = $this->throttleKey($request, $form);

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages([
                'email' => str_replace([':seconds', ':minutes'], [(string) $seconds, (string) ceil($seconds / 60)], $login->label('resetThrottled')),
            ]);
        }

        RateLimiter::hit($key);
    }

    private function throttleKey(Request $request, string $form): string
    {
        return "tungsten-password-{$form}|".$request->ip();
    }

    /**
     * @return array{Panel, PanelLogin}
     */
    private function panelLogin(Request $request): array
    {
        $panel = $this->panels->forRoute($request->route()?->getName());
        $login = $panel?->getLogin();

        abort_unless($panel instanceof Panel && $login instanceof PanelLogin && $login->passwordReset, 404);

        return [$panel, $login];
    }
}
