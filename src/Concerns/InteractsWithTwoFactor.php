<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Concerns;

use Illuminate\Database\Eloquent\Model;
use Phattarachai\Tungsten\Contracts\HasTwoFactor;

/**
 * {@see HasTwoFactor} on an Eloquent user with Fortify's columns: `two_factor_secret` and `two_factor_recovery_codes`
 * (text, stored with `encrypt()` like Fortify, so an app moving between the two keeps its enrolments) and
 * `two_factor_confirmed_at` (timestamp). `php artisan vendor:publish --tag=tungsten-migrations` adds them.
 *
 * @mixin Model
 */
trait InteractsWithTwoFactor
{
    public function hasTwoFactorEnabled(): bool
    {
        return $this->getAttribute('two_factor_confirmed_at') !== null && $this->getAttribute('two_factor_secret') !== null;
    }

    public function getTwoFactorSecret(): ?string
    {
        $secret = $this->getAttribute('two_factor_secret');

        return is_string($secret) && $secret !== '' ? (string) decrypt($secret) : null;
    }

    /**
     * @return list<string>
     */
    public function getTwoFactorRecoveryCodes(): array
    {
        $codes = $this->getAttribute('two_factor_recovery_codes');
        $decoded = is_string($codes) && $codes !== '' ? json_decode((string) decrypt($codes), true) : [];

        return is_array($decoded) ? array_values(array_filter($decoded, is_string(...))) : [];
    }

    /**
     * @param  list<string>  $recoveryCodes
     */
    public function enableTwoFactor(string $secret, array $recoveryCodes): void
    {
        $this->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => encrypt(json_encode(array_values($recoveryCodes))),
            'two_factor_confirmed_at' => now(),
        ])->save();
    }

    /**
     * @param  list<string>  $recoveryCodes
     */
    public function replaceTwoFactorRecoveryCodes(array $recoveryCodes): void
    {
        $this->forceFill(['two_factor_recovery_codes' => encrypt(json_encode(array_values($recoveryCodes)))])->save();
    }

    public function disableTwoFactor(): void
    {
        $this->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }

    public function getTwoFactorLabel(): string
    {
        return (string) ($this->getAttribute('email') ?? $this->getKey());
    }
}
