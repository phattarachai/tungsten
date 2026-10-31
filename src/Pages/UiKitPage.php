<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Pages;

use Illuminate\Http\Request;
use Phattarachai\Tungsten\Page;

/**
 * The kit's kitchen sink: every component in its states, under the current panel's theme. Route it (usually only
 * outside production), with the toast endpoint if you want the toast buttons:
 *
 *     Route::get('ui-kit', UiKitPage::class)->name('ui-kit')->nav('UI Kit', icon: 'palette', sort: 1000);
 *     Route::post('ui-kit/toast', UiKitToastController::class)->name('ui-kit.toast');
 */
class UiKitPage extends Page
{
    public function component(): string
    {
        return 'tungsten::UiKit';
    }

    public function props(Request $request): array
    {
        $toast = str((string) $request->route()?->getName())->append('.toast')->value();

        return ['toastUrl' => app('router')->has($toast) ? route($toast) : null];
    }
}
