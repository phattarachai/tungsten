<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Session\Session;
use LogicException;
use Phattarachai\Tungsten\Auth\AuthSession;
use Phattarachai\Tungsten\Contracts\HasTwoFactor;

/**
 * Authenticator-app sign-in for a panel, turned on with `->login(twoFactor: ...)`: who must use it (`true` everyone, a
 * closure per user) and what a signed-in user still owes before the panel lets them through.
 */
final readonly class PanelTwoFactor
{
    public const string CHALLENGE = 'challenge';

    public const string SETUP = 'setup';

    /**
     * @param  bool|(Closure(Authenticatable): bool)  $required
     * @param  int  $rememberDays  how long "don't ask again on this device" skips the code; 0 hides the choice
     */
    public function __construct(private bool|Closure $required, public int $rememberDays = 0) {}

    public function requiredFor(Authenticatable $user): bool
    {
        return $this->required instanceof Closure ? (bool) ($this->required)($user) : $this->required;
    }

    /**
     * Whether a correct password should wait for a code instead of signing in.
     */
    public function challenges(Authenticatable $user): bool
    {
        return $this->supports($user) && $user->hasTwoFactorEnabled();
    }

    /**
     * Null when the session may use the panel, `challenge` when an enrolled user hasn't given a code this session,
     * `setup` when a user who must use two-factor hasn't enrolled.
     */
    public function outstandingStep(Authenticatable $user, Session $session): ?string
    {
        if (! $this->supports($user) || AuthSession::passed($session, $user, 'otp')) {
            return null;
        }

        return match (true) {
            $user->hasTwoFactorEnabled() => self::CHALLENGE,
            $this->requiredFor($user) => self::SETUP,
            default => null,
        };
    }

    /**
     * @phpstan-assert-if-true HasTwoFactor $user
     */
    public function supports(Authenticatable $user): bool
    {
        if ($user instanceof HasTwoFactor) {
            return true;
        }

        if ($this->requiredFor($user)) {
            throw new LogicException('Two-factor sign-in is required for ['.$user::class.'], which does not implement '.HasTwoFactor::class.'.');
        }

        return false;
    }
}
