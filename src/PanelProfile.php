<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Storage;

/**
 * A panel's own profile page, turned on with {@see Panel::profile()}: name, email, password and, when `avatar` names
 * a column, a photo stored on `disk`.
 */
final readonly class PanelProfile
{
    /**
     * @param  array<string, string>  $labels
     */
    public function __construct(
        public ?string $avatar = null,
        public string $disk = 'public',
        private array $labels = [],
    ) {}

    /**
     * `tungsten.profile.labels`, with this panel's overrides on top.
     *
     * @return array<string, string>
     */
    public function labels(): array
    {
        return [...(array) config('tungsten.profile.labels', []), ...$this->labels];
    }

    public function avatarUrl(?Authenticatable $user): ?string
    {
        $path = $this->avatar === null || $user === null ? null : data_get($user, $this->avatar);

        return is_string($path) && $path !== '' ? Storage::disk($this->disk)->url($path) : null;
    }
}
