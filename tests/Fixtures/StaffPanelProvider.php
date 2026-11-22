<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures;

use Illuminate\Contracts\Auth\Authenticatable;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelProvider;

/**
 * A panel with the whole staff sign-in: password reset and two-factor, required for managers only.
 */
class StaffPanelProvider extends PanelProvider
{
    public function id(): string
    {
        return 'staff';
    }

    public function panel(Panel $panel): Panel
    {
        return $panel
            ->path('staff')
            ->label('Staff')
            ->profile(emailEditable: false)
            ->login(
                passwordReset: true,
                twoFactor: fn (Authenticatable $user): bool => ($user->role ?? null) === 'manager',
                twoFactorRememberDays: 30,
            );
    }
}
