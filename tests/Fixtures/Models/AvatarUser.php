<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests\Fixtures\Models;

use Illuminate\Http\UploadedFile;
use Phattarachai\Tungsten\Contracts\HasPanelAvatar;

class AvatarUser extends User implements HasPanelAvatar
{
    public ?string $mediaUrl = null;

    /** @var list<UploadedFile|null> */
    public array $received = [];

    public ?string $savedNameOnStore = null;

    protected $table = 'users';

    public function getPanelAvatarUrl(): ?string
    {
        return $this->mediaUrl;
    }

    public function setPanelAvatar(?UploadedFile $file): void
    {
        $this->received[] = $file;
        $this->savedNameOnStore = static::query()->whereKey($this->getKey())->value('name');
    }
}
