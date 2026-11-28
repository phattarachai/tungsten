<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Concerns\Panel;

use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Support\Str;
use Phattarachai\Tungsten\Auth\PanelPasswordReset;
use Phattarachai\Tungsten\Auth\RememberedDevice;
use Phattarachai\Tungsten\Contracts\HasPanelAvatar;
use Phattarachai\Tungsten\Http\Middleware\AuthenticatePanel;
use Phattarachai\Tungsten\Http\Middleware\EnsureTwoFactor;
use Phattarachai\Tungsten\Http\Middleware\HandleTungstenRequests;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;
use Phattarachai\Tungsten\PanelProfile;
use Phattarachai\Tungsten\PanelTwoFactor;

/**
 * A {@see Panel}'s sign-in, profile page, sign-out, gate ability and route middleware.
 */
trait HasAuthentication
{
    private ?PanelLogin $login = null;

    private ?PanelProfile $profile = null;

    private ?string $ability;

    /**
     * @var list<string>
     */
    private array $middleware = [];

    private string|Closure|false|null $logoutUrl = null;

    /**
     * The panel's own sign-in page at `{path}/login` (and sign-out at `{path}/logout`), against `$guard` (the default
     * guard when null) and its user provider. Guests on the panel's routes are sent there instead of the app's login.
     * A user must also pass the panel's ability and `$authorize` (false or a message string refuses them).
     *
     * `$passwordReset` adds the panel's own forgot / reset password pages (`true` on the default password broker, a
     * string names another). `$twoFactor` adds authenticator-app codes: `true` makes every user enrol at their next
     * sign-in, a closure decides per user, and anyone who isn't required may still turn it on from the profile page.
     * `$twoFactorRememberDays` adds "don't ask again on this device" to the code page: a browser that ticks it skips the
     * code (not the password) for that many days, until the password or the phone changes ({@see RememberedDevice}).
     *
     * @param  array<string, string>  $labels  overrides for `tungsten.login.labels`
     * @param  (Closure(Authenticatable, Panel): (bool|string|null))|null  $authorize
     * @param  bool|(Closure(Authenticatable): bool)  $twoFactor
     */
    public function login(
        ?string $guard = null,
        array $labels = [],
        string|Closure|null $forgotPasswordUrl = null,
        ?Closure $authorize = null,
        bool|string $passwordReset = false,
        bool|Closure $twoFactor = false,
        int $twoFactorRememberDays = 0,
    ): self {
        $this->login = new PanelLogin(
            $guard,
            $labels,
            $forgotPasswordUrl,
            $authorize,
            passwordReset: $passwordReset !== false && $passwordReset !== '',
            passwordBroker: is_string($passwordReset) && $passwordReset !== '' ? $passwordReset : null,
            twoFactor: $twoFactor === false ? null : new PanelTwoFactor($twoFactor, max(0, $twoFactorRememberDays)),
        );

        return $this;
    }

    /**
     * The signed-in user's own profile page at `{path}/profile`: name, email, password and a photo, either through
     * {@see HasPanelAvatar} on the user or, when `$avatar` names a column on the user, stored on `$disk`. Linked from
     * the user menu.
     *
     * @param  array<string, string>  $labels  overrides for `tungsten.profile.labels`
     */
    public function profile(?string $avatar = null, string $disk = 'public', array $labels = [], bool $emailEditable = true): self
    {
        $this->profile = new PanelProfile($avatar, $disk, $labels, $emailEditable);

        return $this;
    }

    public function getProfile(): ?PanelProfile
    {
        return $this->profile;
    }

    /**
     * The Gate ability every route of the panel is behind; null for none. Defaults to `access{Id}`.
     */
    public function ability(?string $ability): self
    {
        $this->ability = $ability;

        return $this;
    }

    /**
     * Route middleware on top of `tungsten.middleware` (e.g. a feature-flag check).
     *
     * @param  list<string>  $middleware
     */
    public function middleware(array $middleware): self
    {
        $this->middleware = $middleware;

        return $this;
    }

    /**
     * The sign-out POST target: a route name, a URL, or a closure; false for none. `tungsten.logout_route` when unset.
     */
    public function logoutUrl(string|Closure|false $url): self
    {
        $this->logoutUrl = $url;

        return $this;
    }

    public function getLogin(): ?PanelLogin
    {
        return $this->login;
    }

    /**
     * Mails `$user` a link to this panel's reset-password page, e.g. from an admin's "send reset link" action. Needs
     * `->login(passwordReset: true)`. Returns the broker's status: `Password::RESET_LINK_SENT`, or `RESET_THROTTLED`
     * when a link went out within the broker's throttle (60 seconds by default).
     */
    public function sendPasswordResetLink(CanResetPassword $user): string
    {
        return new PanelPasswordReset($this)->sendLink(['email' => $user->getEmailForPasswordReset()]);
    }

    public function loginUrl(): ?string
    {
        return $this->login === null ? null : route("{$this->id}.login");
    }

    public function getAbility(): ?string
    {
        return $this->ability;
    }

    /**
     * @return list<string>
     */
    public function routeMiddleware(): array
    {
        return array_values(array_filter([
            ...$this->withPanelLogin((array) config('tungsten.middleware', ['web', 'auth'])),
            $this->login?->twoFactor === null ? null : EnsureTwoFactor::class,
            ...$this->middleware,
            $this->ability === null ? null : "can:{$this->ability}",
            HandleTungstenRequests::class,
        ]));
    }

    public function logoutUrlFor(): ?string
    {
        $url = $this->logoutUrl ?? ($this->login === null ? config('tungsten.logout_route') : "{$this->id}.logout");

        return match (true) {
            $url === false => null,
            $url instanceof Closure => $url(),
            ! is_string($url) || $url === '' => null,
            app('router')->has($url) => route($url),
            str_contains($url, '/') => url($url),
            default => null,
        };
    }

    /**
     * With a panel login, `auth` becomes {@see AuthenticatePanel} (same check, but guests go to the panel's login), on
     * the login's guard when `auth` names none; it is added when the stack has no `auth`.
     *
     * @param  array<int, mixed>  $middleware
     * @return array<int, mixed>
     */
    private function withPanelLogin(array $middleware): array
    {
        if ($this->login === null) {
            return $middleware;
        }

        $guarded = $this->login->guard === null ? AuthenticatePanel::class : AuthenticatePanel::class.":{$this->login->guard}";
        $swapped = array_map(fn (mixed $entry): mixed => match (true) {
            $entry === 'auth' => $guarded,
            is_string($entry) && str_starts_with($entry, 'auth:') => AuthenticatePanel::class.':'.Str::after($entry, 'auth:'),
            default => $entry,
        }, $middleware);

        return $swapped === $middleware ? [...$middleware, $guarded] : $swapped;
    }
}
