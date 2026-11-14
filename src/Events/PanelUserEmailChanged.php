<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Events;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired whenever Tungsten changes a user's email (today: the panel's own profile form), so an app whose other sign-ins
 * trust the email can react: revoke tokens, sync a linked account, tell the old address.
 */
final readonly class PanelUserEmailChanged
{
    use Dispatchable;

    public function __construct(
        public Authenticatable $user,
        public string $oldEmail,
        public string $newEmail,
        public string $panel,
    ) {}
}
