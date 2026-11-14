<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Auth;

use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use LogicException;
use Phattarachai\Tungsten\Notifications\PanelResetPasswordNotification;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelLogin;

/**
 * A panel's password reset through Laravel's password broker: the link goes out as
 * {@see PanelResetPasswordNotification} pointing at the panel's own reset page.
 */
final readonly class PanelPasswordReset
{
    private PanelLogin $login;

    public function __construct(private Panel $panel)
    {
        $login = $panel->getLogin();

        if (! $login instanceof PanelLogin || ! $login->passwordReset) {
            throw new LogicException("Panel [{$panel->getId()}] has no password reset: call ->login(passwordReset: true).");
        }

        $this->login = $login;
    }

    /**
     * Mails a reset link to the user `$credentials` find (usually `['email' => …]`). Returns the broker's status
     * (`Password::RESET_LINK_SENT`, `INVALID_USER`, `RESET_THROTTLED`).
     *
     * @param  array<string, mixed>  $credentials
     */
    public function sendLink(array $credentials): string
    {
        return $this->broker()->sendResetLink($credentials, function (CanResetPassword $user, string $token): string {
            $url = route("{$this->panel->getId()}.password.reset", ['token' => $token, 'email' => $user->getEmailForPasswordReset()]);

            if (! method_exists($user, 'notify')) {
                throw new LogicException('The user model needs the Notifiable trait to receive the reset link.');
            }

            $user->notify(new PanelResetPasswordNotification($url, $this->expireMinutes(), $this->login->labels()));

            return Password::RESET_LINK_SENT;
        });
    }

    /**
     * Sets the new password when the token is valid for `email`. Returns the broker's status (`PASSWORD_RESET`,
     * `INVALID_TOKEN`, `INVALID_USER`).
     *
     * @param  array{email: string, token: string, password: string, password_confirmation?: string}  $credentials
     */
    public function reset(array $credentials): string
    {
        return (string) $this->broker()->reset($credentials, function (Model&Authenticatable&CanResetPassword $user, string $password): void {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();

            event(new PasswordReset($user));
        });
    }

    private function broker(): PasswordBroker
    {
        return Password::broker($this->login->passwordBroker);
    }

    private function expireMinutes(): int
    {
        $broker = $this->login->passwordBroker ?? config('auth.defaults.passwords', 'users');

        return (int) config("auth.passwords.{$broker}.expire", 60);
    }
}
