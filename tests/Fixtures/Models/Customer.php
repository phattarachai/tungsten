<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    public $timestamps = false;

    protected $guarded = [];
}
