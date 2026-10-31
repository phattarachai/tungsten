<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Override;
use Phattarachai\Tungsten\Console\InstallCommand;
use Phattarachai\Tungsten\Console\MakePageCommand;
use Phattarachai\Tungsten\Http\Controllers\PageController;

class TungstenServiceProvider extends ServiceProvider
{
    #[Override]
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/tungsten.php', 'tungsten');

        $this->app->singleton(PanelRegistry::class);

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

    private function registerPanelRoutes(): void
    {
        foreach ($this->app->make(PanelRegistry::class)->all() as $panel) {
            Route::prefix($panel->getPath())
                ->middleware($panel->routeMiddleware())
                ->name("{$panel->getId()}.")
                ->group(function () use ($panel): void {
                    $panel->resolvePages()->each($this->registerPage(...));
                    $panel->registerRoutes();
                });
        }

        Route::getRoutes()->refreshNameLookups();
        Route::getRoutes()->refreshActionLookups();
    }

    private function registerPage(Page $page): void
    {
        $route = Route::get($page->path(), PageController::class)
            ->name($page->routeKey())
            ->setWheres($page->wheres());

        if ($page->ability() !== null) {
            $route->middleware("can:{$page->ability()}");
        }

        $page->route($route);
        $page->endpoints();
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
