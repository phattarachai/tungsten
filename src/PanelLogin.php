<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Gate;

/**
 * A panel's own sign-in, turned on with {@see Panel::login()}: the guard it signs into, the page's labels, an optional
 * forgot-password link and the checks a user must pass after the password does.
 */
final readonly class PanelLogin
{
    /**
     * @param  array<string, string>  $labels
     * @param  (Closure(Authenticatable, Panel): (bool|string|null))|null  $authorize
     */
    public function __construct(
        public ?string $guard = null,
        private array $labels = [],
        private string|Closure|null $forgotPasswordUrl = null,
        private ?Closure $authorize = null,
    ) {}

    /**
     * `tungsten.login.labels`, with this panel's overrides on top.
     *
     * @return array<string, string>
     */
    public function labels(): array
    {
        return [...(array) config('tungsten.login.labels', []), ...$this->labels];
    }

    public function label(string $key): string
    {
        return $this->labels()[$key] ?? $key;
    }

    public function forgotPasswordUrl(): ?string
    {
        $url = $this->forgotPasswordUrl instanceof Closure ? ($this->forgotPasswordUrl)() : $this->forgotPasswordUrl;

        return match (true) {
            ! is_string($url) || $url === '' => null,
            app('router')->has($url) => route($url),
            default => url($url),
        };
    }

    /**
     * Null when `$user` may sign in to `$panel`, else the message to show: the panel's ability first, then the
     * `authorize` hook (false gives the `denied` label, a string is shown as is).
     */
    public function refusal(Authenticatable $user, Panel $panel): ?string
    {
        $ability = $panel->getAbility();

        if ($ability !== null && Gate::forUser($user)->denies($ability)) {
            return $this->label('denied');
        }

        $verdict = $this->authorize?->__invoke($user, $panel);

        return match (true) {
            is_string($verdict) => $verdict,
            $verdict === false => $this->label('denied'),
            default => null,
        };
    }
}
