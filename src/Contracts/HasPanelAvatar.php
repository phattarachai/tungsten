<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Contracts;

use Illuminate\Http\UploadedFile;

/**
 * On the user model, for an app that keeps photos its own way (Media Library, say) instead of a column on the user:
 * the profile page and the topbar read and store the photo through it, and it wins over `->profile(avatar:)`.
 */
interface HasPanelAvatar
{
    /** The photo's URL; null or an empty string means no photo. */
    public function getPanelAvatarUrl(): ?string;

    /** Replaces the photo with `$file`, or clears it on null. Called after the user's name and email are saved. */
    public function setPanelAvatar(?UploadedFile $file): void;
}
