<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Requests;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;

class LoginRequest extends FormRequest
{
    private const int MAX_ATTEMPTS = 5;

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ];
    }

    /**
     * The user, when the credentials are right and the panel lets them in; every refusal counts towards the throttle
     * (per email and IP) and the account lock (per email, from any IP), which a success clears. A locked account is
     * refused before its password is checked. Nobody is signed in yet: a user with two-factor still owes a code.
     *
     * @throws ValidationException
     */
    public function verifiedUserFor(Panel $panel, PanelLogin $login): Authenticatable
    {
        $this->ensureIsNotRateLimited($login);
        $this->ensureAccountIsNotLocked($login);

        $guard = $this->guard($login);
        $user = $this->verifiedUser($guard);

        if (! $user instanceof Authenticatable) {
            $this->refuse($login, $login->label('failed'));
        }

        $refusal = $login->refusal($user, $panel);

        if ($refusal !== null) {
            $this->refuse($login, $refusal);
        }

        RateLimiter::clear($this->throttleKey());
        RateLimiter::clear($this->accountKey($login));

        return $user;
    }

    /**
     * The account lock's key: the guard and the email, trimmed and lower-cased, whatever IP the attempt comes from.
     */
    public static function accountThrottleKey(string $email, ?string $guard = null): string
    {
        $guard ??= (string) config('auth.defaults.guard');

        return "tungsten-login-account:{$guard}:".sha1(Str::lower(trim($email)));
    }

    private function guard(PanelLogin $login): StatefulGuard
    {
        /** @var StatefulGuard $guard */
        $guard = Auth::guard($login->guard);

        return $guard;
    }

    private function verifiedUser(StatefulGuard $guard): ?Authenticatable
    {
        $credentials = ['email' => $this->validated('email'), 'password' => $this->validated('password')];

        if (! $guard->validate($credentials)) {
            return null;
        }

        return method_exists($guard, 'getLastAttempted') ? $guard->getLastAttempted() : null;
    }

    private function refuse(PanelLogin $login, string $message): never
    {
        RateLimiter::hit($this->throttleKey());
        $this->countAccountFailure($login);

        throw ValidationException::withMessages(['email' => $message]);
    }

    private function countAccountFailure(PanelLogin $login): void
    {
        $maxAttempts = $this->accountMaxAttempts();

        if ($maxAttempts === null) {
            return;
        }

        $attempts = RateLimiter::hit($this->accountKey($login), (int) config('tungsten.login.lockout.decay_minutes', 15) * 60);

        if ($attempts === $maxAttempts) {
            Log::warning('Tungsten panel login locked after repeated failures', ['ip' => $this->ip()]);
        }
    }

    private function ensureIsNotRateLimited(PanelLogin $login): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), self::MAX_ATTEMPTS)) {
            return;
        }

        $this->lockOut($login, 'throttled', $this->throttleKey());
    }

    private function ensureAccountIsNotLocked(PanelLogin $login): void
    {
        $maxAttempts = $this->accountMaxAttempts();

        if ($maxAttempts === null || ! RateLimiter::tooManyAttempts($this->accountKey($login), $maxAttempts)) {
            return;
        }

        $this->lockOut($login, 'locked', $this->accountKey($login));
    }

    private function lockOut(PanelLogin $login, string $label, string $key): never
    {
        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($key);

        throw ValidationException::withMessages([
            'email' => str_replace([':seconds', ':minutes'], [(string) $seconds, (string) ceil($seconds / 60)], $login->label($label)),
        ]);
    }

    private function accountMaxAttempts(): ?int
    {
        $maxAttempts = config('tungsten.login.lockout.max_attempts', 10);

        return is_numeric($maxAttempts) && (int) $maxAttempts > 0 ? (int) $maxAttempts : null;
    }

    private function accountKey(PanelLogin $login): string
    {
        return self::accountThrottleKey((string) $this->input('email'), $login->guard);
    }

    private function throttleKey(): string
    {
        return Str::transliterate(Str::lower((string) $this->input('email')).'|'.$this->ip());
    }
}
