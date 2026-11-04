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
    /** The URL to show, which may be a generated placeholder; null or an empty string shows the initial. */
    public function getPanelAvatarUrl(): ?string;

    /** Whether the user has a photo of their own to remove, as opposed to a placeholder. */
    public function hasPanelAvatar(): bool;

    /** Replaces the photo with `$file`, or clears it on null. Called after the user's name and email are saved. */
    public function setPanelAvatar(?UploadedFile $file): void;
}
