<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Requests;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
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
     * Signs the user in when the credentials are right and the panel lets them in; every refusal counts towards the
     * throttle, which a success clears.
     *
     * @throws ValidationException
     */
    public function authenticate(Panel $panel, PanelLogin $login): void
    {
        $this->ensureIsNotRateLimited($login);

        $guard = $this->guard($login);
        $user = $this->verifiedUser($guard);

        if (! $user instanceof Authenticatable) {
            $this->refuse($login->label('failed'));
        }

        $refusal = $login->refusal($user, $panel);

        if ($refusal !== null) {
            $this->refuse($refusal);
        }

        $guard->login($user, $this->boolean('remember'));
        RateLimiter::clear($this->throttleKey());
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

    private function refuse(string $message): never
    {
        RateLimiter::hit($this->throttleKey());

        throw ValidationException::withMessages(['email' => $message]);
    }

    private function ensureIsNotRateLimited(PanelLogin $login): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), self::MAX_ATTEMPTS)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => str_replace([':seconds', ':minutes'], [(string) $seconds, (string) ceil($seconds / 60)], $login->label('throttled')),
        ]);
    }

    private function throttleKey(): string
    {
        return Str::transliterate(Str::lower((string) $this->input('email')).'|'.$this->ip());
    }
}
