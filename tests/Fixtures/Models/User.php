<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Phattarachai\Tungsten\Concerns\InteractsWithTwoFactor;
use Phattarachai\Tungsten\Contracts\HasTwoFactor;

class User extends Authenticatable implements HasTwoFactor
{
    use InteractsWithTwoFactor;
    use Notifiable;

    protected $guarded = [];

    protected $hidden = ['password', 'remember_token'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['password' => 'hashed'];
    }
}
