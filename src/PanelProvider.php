<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Support\ServiceProvider;
use Override;

/**
 * Extend once per panel and list it in `bootstrap/providers.php`:
 *
 *     public function panel(Panel $panel): Panel
 *     {
 *         return $panel->path('admin')->label('Admin')->discoverSets(app_path('Panel/Sets'), 'App\\Panel\\Sets');
 *     }
 *
 * @see docs/kernel.md
 */
abstract class PanelProvider extends ServiceProvider
{
    abstract public function panel(Panel $panel): Panel;

    public function id(): string
    {
        return 'admin';
    }

    #[Override]
    public function register(): void
    {
        $register = fn (PanelRegistry $registry): PanelRegistry => $registry->register($this->panel(Panel::make($this->id())));

        if ($this->app->resolved(PanelRegistry::class)) {
            $register($this->app->make(PanelRegistry::class));

            return;
        }

        $this->app->afterResolving(PanelRegistry::class, $register);
    }
}
