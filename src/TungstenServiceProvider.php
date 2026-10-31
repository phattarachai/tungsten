<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Override;
use Phattarachai\Tungsten\Console\InstallCommand;
use Phattarachai\Tungsten\Console\MakePageCommand;

class TungstenServiceProvider extends ServiceProvider
{
    #[Override]
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/tungsten.php', 'tungsten');

        $this->app->singleton(PanelRegistry::class);

        RouteMeta::register();

        $this->disableInertiaDevtools();
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'tungsten');

        if ($this->app->runningInConsole()) {
            $this->publishes([__DIR__.'/../config/tungsten.php' => config_path('tungsten.php')], 'tungsten-config');
            $this->commands([InstallCommand::class, MakePageCommand::class]);
        }

        $this->app->booted(function (): void {
            if (! $this->app->routesAreCached()) {
                $this->registerPanelRoutes();
            }
        });
    }

    /**
     * Each panel's set and `->routes()` declarations, inside its group. Route files add theirs with
     * `Tungsten::routes()`; nothing is generated from page classes.
     */
    private function registerPanelRoutes(): void
    {
        foreach ($this->app->make(PanelRegistry::class)->all() as $panel) {
            Tungsten::routes($panel->getId(), $panel->registerRoutes(...));
        }

        Route::getRoutes()->refreshNameLookups();
        Route::getRoutes()->refreshActionLookups();
    }

    private function disableInertiaDevtools(): void
    {
        $this->app->booting(function (): void {
            if (config('tungsten.disable_inertia_devtools') && config('inertia.devtools.enabled') === null) {
                config(['inertia.devtools.enabled' => false]);
            }
        });
    }
}
