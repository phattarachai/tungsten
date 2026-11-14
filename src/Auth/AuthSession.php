<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Session\Session;

/**
 * What a panel sign-in keeps in the session: how the user proved who they are (`amr`, RFC 8176: `pwd`, `otp`), a
 * correct password waiting for its code, and an enrolment in progress. Each entry names its user, so a session another
 * login (Filament's, say) takes over never inherits them.
 */
final class AuthSession
{
    public const string AMR = 'tungsten.auth.amr';

    public const string CHALLENGE = 'tungsten.auth.challenge';

    public const string SETUP = 'tungsten.auth.setup';

    public const string RECOVERY_CODES = 'tungsten.auth.recovery_codes';

    /**
     * The methods `$user` signed in with this session, in the order they were used.
     *
     * @return list<string>
     */
    public static function amr(Session $session, Authenticatable $user): array
    {
        $amr = $session->get(self::AMR);

        if (! is_array($amr) || ($amr['user'] ?? null) !== self::id($user)) {
            return [];
        }

        return array_values(array_filter((array) ($amr['methods'] ?? []), is_string(...)));
    }

    public static function passed(Session $session, Authenticatable $user, string $method): bool
    {
        return in_array($method, self::amr($session, $user), true);
    }

    /**
     * Adds `$methods` to what `$user` has used this session (starting over when the session was another user's).
     *
     * @param  list<string>  $methods
     */
    public static function record(Session $session, Authenticatable $user, array $methods): void
    {
        $session->put(self::AMR, [
            'user' => self::id($user),
            'methods' => array_values(array_unique([...self::amr($session, $user), ...$methods])),
        ]);
    }

    /**
     * Holds a user whose password was right until they give their code; they are not signed in yet.
     */
    public static function startChallenge(Session $session, string $panel, Authenticatable $user, bool $remember): void
    {
        $session->put(self::CHALLENGE, [
            'panel' => $panel,
            'user' => self::id($user),
            'remember' => $remember,
            'expires' => now()->addMinutes((int) config('tungsten.login.two_factor.challenge_minutes', 10))->getTimestamp(),
        ]);
    }

    /**
     * The waiting sign-in for `$panel`, if it hasn't expired.
     *
     * @return array{user: string, remember: bool}|null
     */
    public static function challenge(Session $session, string $panel): ?array
    {
        $challenge = $session->get(self::CHALLENGE);

        if (! is_array($challenge) || ($challenge['panel'] ?? null) !== $panel || (int) ($challenge['expires'] ?? 0) < now()->getTimestamp()) {
            return null;
        }

        return ['user' => (string) $challenge['user'], 'remember' => (bool) ($challenge['remember'] ?? false)];
    }

    public static function forgetChallenge(Session $session): void
    {
        $session->forget(self::CHALLENGE);
    }

    /**
     * The secret `$user` is enrolling with, kept here (not on the user) until a code confirms it, so starting over
     * never breaks an authenticator that already works.
     */
    public static function setupSecret(Session $session, Authenticatable $user, callable $generate): string
    {
        $setup = $session->get(self::SETUP);

        if (is_array($setup) && ($setup['user'] ?? null) === self::id($user) && is_string($setup['secret'] ?? null)) {
            return $setup['secret'];
        }

        $secret = (string) $generate();
        $session->put(self::SETUP, ['user' => self::id($user), 'secret' => $secret]);

        return $secret;
    }

    public static function pendingSetupSecret(Session $session, Authenticatable $user): ?string
    {
        $setup = $session->get(self::SETUP);

        return is_array($setup) && ($setup['user'] ?? null) === self::id($user) && is_string($setup['secret'] ?? null) ? $setup['secret'] : null;
    }

    public static function forgetSetup(Session $session): void
    {
        $session->forget(self::SETUP);
    }

    public static function id(Authenticatable $user): string
    {
        return (string) $user->getAuthIdentifier();
    }
}
