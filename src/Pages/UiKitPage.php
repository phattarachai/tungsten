<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Pages;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Override;
use Phattarachai\Tungsten\Http\Controllers\UiKitToastController;
use Phattarachai\Tungsten\Page;

/**
 * The kit's kitchen sink: every component in its states, under the current panel's theme. Add it to a panel
 * (usually only outside production) with `->pages([UiKitPage::class])`.
 */
class UiKitPage extends Page
{
    public function path(): string
    {
        return 'ui-kit';
    }

    public function component(): string
    {
        return 'tungsten::UiKit';
    }

    public function navLabel(): string
    {
        return 'UI Kit';
    }

    #[Override]
    public function navIcon(): ?string
    {
        return 'palette';
    }

    #[Override]
    public function navSort(): int
    {
        return 1000;
    }

    #[Override]
    public function endpoints(): void
    {
        Route::post('ui-kit/toast', UiKitToastController::class)->name('ui-kit.toast');
    }

    public function props(Request $request): array
    {
        $panel = str((string) $request->route()?->getName())->before('.')->value();

        return ['toastUrl' => route("{$panel}.ui-kit.toast")];
    }
}
