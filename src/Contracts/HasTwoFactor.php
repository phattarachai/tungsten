<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Contracts;

use Phattarachai\Tungsten\Concerns\InteractsWithTwoFactor;

/**
 * On the user model, for a panel with `->login(twoFactor: ...)`: the authenticator-app secret and the recovery codes.
 * {@see InteractsWithTwoFactor} implements it on Fortify's columns
 * (`two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`).
 */
interface HasTwoFactor
{
    /** Whether the user has confirmed an authenticator app, so every sign-in asks for its code. */
    public function hasTwoFactorEnabled(): bool;

    /** The TOTP secret (base32), decrypted; null when not enrolled. */
    public function getTwoFactorSecret(): ?string;

    /**
     * The unused recovery codes.
     *
     * @return list<string>
     */
    public function getTwoFactorRecoveryCodes(): array;

    /**
     * Turns two-factor on with a confirmed secret and fresh recovery codes, replacing any earlier enrolment.
     *
     * @param  list<string>  $recoveryCodes
     */
    public function enableTwoFactor(string $secret, array $recoveryCodes): void;

    /**
     * Replaces the recovery codes.
     *
     * @param  list<string>  $recoveryCodes
     */
    public function replaceTwoFactorRecoveryCodes(array $recoveryCodes): void;

    /** Clears the secret, the codes and the confirmation. */
    public function disableTwoFactor(): void;

    /** The label the authenticator app shows for this account (usually the email). */
    public function getTwoFactorLabel(): string;
}
