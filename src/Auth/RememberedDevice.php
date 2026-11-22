<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Phattarachai\Tungsten\Contracts\HasTwoFactor;

/**
 * A browser that gave a correct code with "don't ask again on this device" ticked: a cookie that lets the user skip the
 * code (not the password) for `->login(twoFactorRememberDays: n)` days. It holds the user's id and its expiry, signed
 * with the app key over the user's password hash and two-factor secret, so changing the password or enrolling a new
 * phone forgets every device at once. Nothing is stored on the server.
 */
final class RememberedDevice
{
    public const string COOKIE = 'tungsten_remembered_device';

    /**
     * Queues the cookie for `$user`, valid `$days` days.
     */
    public static function remember(Authenticatable&HasTwoFactor $user, int $days): void
    {
        $payload = AuthSession::id($user).'|'.now()->addDays($days)->getTimestamp();
        $signature = self::sign($payload, $user);

        if ($signature === null) {
            return;
        }

        Cookie::queue(Cookie::make(self::COOKIE, base64_encode($payload).'.'.$signature, $days * 24 * 60));
    }

    /**
     * Whether this request comes from a browser `$user` asked to remember, still in date.
     */
    public static function recognizes(Request $request, Authenticatable $user): bool
    {
        if (! $user instanceof HasTwoFactor) {
            return false;
        }

        [$encoded, $signature] = array_pad(explode('.', (string) $request->cookie(self::COOKIE), 2), 2, '');
        $payload = (string) base64_decode($encoded, true);
        [$id, $expires] = array_pad(explode('|', $payload, 2), 2, '');
        $expected = self::sign($payload, $user);

        return $expected !== null
            && $id === AuthSession::id($user)
            && (int) $expires > now()->getTimestamp()
            && hash_equals($expected, $signature);
    }

    /**
     * The signature over `$payload`, bound to the user's password and secret; null when the user has no secret.
     */
    private static function sign(string $payload, Authenticatable&HasTwoFactor $user): ?string
    {
        $secret = $user->getTwoFactorSecret();

        if ($secret === null || $secret === '') {
            return null;
        }

        return hash_hmac('sha256', $payload.'|'.$user->getAuthPassword().'|'.$secret, (string) config('app.key'));
    }
}
