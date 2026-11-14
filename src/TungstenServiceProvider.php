<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Routing\Events\PreparingResponse;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Override;
use Phattarachai\Tungsten\Console\InstallCommand;
use Phattarachai\Tungsten\Console\MakePageCommand;
use Phattarachai\Tungsten\Http\Controllers\LoginController;
use Phattarachai\Tungsten\Http\Controllers\PasswordResetController;
use Phattarachai\Tungsten\Http\Controllers\TwoFactorChallengeController;
use Phattarachai\Tungsten\Http\Controllers\TwoFactorSetupController;
use Phattarachai\Tungsten\Http\Middleware\AuthenticatePanel;
use Phattarachai\Tungsten\Http\Middleware\EnsureTwoFactor;
use Phattarachai\Tungsten\Http\Middleware\HandleTungstenRequests;
use Phattarachai\Tungsten\Listeners\GuardReservedProps;

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
        $this->app['router']->aliasMiddleware('tungsten.two-factor', EnsureTwoFactor::class);
        Event::listen(PreparingResponse::class, GuardReservedProps::class);

        if ($this->app->runningInConsole()) {
            $this->publishes([__DIR__.'/../config/tungsten.php' => config_path('tungsten.php')], 'tungsten-config');
            $this->publishesMigrations([__DIR__.'/../database/migrations' => database_path('migrations')], 'tungsten-migrations');
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
            $this->registerLoginRoutes($panel);
            Tungsten::routes($panel->getId(), $panel->registerRoutes(...));
        }

        Route::getRoutes()->refreshNameLookups();
        Route::getRoutes()->refreshActionLookups();
    }

    /**
     * `{path}/login` and `{path}/logout` for a panel with `->login()`: outside its auth and gate, inside its name prefix
     * so the page gets the panel's chrome props.
     */
    private function registerLoginRoutes(Panel $panel): void
    {
        $login = $panel->getLogin();

        if ($login === null) {
            return;
        }

        Route::prefix($panel->getPath())
            ->middleware([...(array) config('tungsten.login.middleware', ['web']), HandleTungstenRequests::class])
            ->name("{$panel->getId()}.")
            ->group(function () use ($login): void {
                Route::get('login', [LoginController::class, 'show'])->name('login');
                Route::post('login', [LoginController::class, 'store'])->name('login.attempt');
                Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

                if ($login->passwordReset) {
                    $this->registerPasswordResetRoutes();
                }

                if ($login->twoFactor !== null) {
                    $this->registerTwoFactorRoutes($login->guard);
                }
            });
    }

    /**
     * `{path}/forgot-password` and `{path}/reset-password/{token}`, for guests.
     */
    private function registerPasswordResetRoutes(): void
    {
        Route::get('forgot-password', [PasswordResetController::class, 'request'])->name('password.request');
        Route::post('forgot-password', [PasswordResetController::class, 'email'])->name('password.email');
        Route::get('reset-password/{token}', [PasswordResetController::class, 'edit'])->name('password.reset');
        Route::post('reset-password', [PasswordResetController::class, 'update'])->name('password.update');
    }

    /**
     * `{path}/two-factor-challenge` (a password waiting for its code, or a signed-in session that owes one) and
     * `{path}/two-factor/setup` (signed in), outside {@see EnsureTwoFactor} since they are where it sends users.
     */
    private function registerTwoFactorRoutes(?string $guard): void
    {
        $auth = $guard === null ? AuthenticatePanel::class : AuthenticatePanel::class.":{$guard}";

        Route::get('two-factor-challenge', [TwoFactorChallengeController::class, 'show'])->name('two-factor.challenge');
        Route::post('two-factor-challenge', [TwoFactorChallengeController::class, 'store'])->name('two-factor.attempt');
        Route::get('two-factor/setup', [TwoFactorSetupController::class, 'show'])->middleware($auth)->name('two-factor.setup');
        Route::post('two-factor/setup', [TwoFactorSetupController::class, 'store'])->middleware($auth)->name('two-factor.confirm');
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
