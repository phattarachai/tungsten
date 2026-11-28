<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Closure;
use Illuminate\Routing\Route;
use Illuminate\Support\Str;
use Phattarachai\Tungsten\Concerns\Panel\HasAuthentication;
use Phattarachai\Tungsten\Concerns\Panel\HasBranding;
use Phattarachai\Tungsten\Concerns\Panel\HasGlobalSearch;
use Phattarachai\Tungsten\Concerns\Panel\HasNavigation;
use Phattarachai\Tungsten\Concerns\Panel\HasNotifications;
use Phattarachai\Tungsten\Concerns\Panel\HasSets;
use Phattarachai\Tungsten\Http\Controllers\GlobalSearchController;
use Phattarachai\Tungsten\Http\Controllers\NotificationController;
use Phattarachai\Tungsten\Http\Controllers\ProfileController;
use Phattarachai\Tungsten\Http\Controllers\TwoFactorProfileController;

/**
 * One admin panel: its path, chrome, gate and sets. Declared in a {@see PanelProvider} and held by the
 * {@see PanelRegistry}. Its routes are plain Laravel routes; it reads their `->nav()` / `->breadcrumb()` metadata
 * to build the sidebar, breadcrumbs and help.
 *
 * @see docs/kernel.md
 */
class Panel
{
    use HasAuthentication;
    use HasBranding;
    use HasGlobalSearch;
    use HasNavigation;
    use HasNotifications;
    use HasSets;

    private string $id;

    private string $path;

    private string $label;

    private ?Closure $routes = null;

    public static function make(string $id): self
    {
        $panel = new self;
        $panel->id = $id;
        $panel->path = $id;
        $panel->label = Str::headline($id);
        $panel->ability = 'access'.Str::studly($id);

        return $panel;
    }

    public function path(string $path): self
    {
        $this->path = trim($path, '/');

        return $this;
    }

    public function label(string $label): self
    {
        $this->label = $label;

        return $this;
    }

    /**
     * Routes declared with the panel, inside its prefix, middleware and `{id}.` name prefix. Point them at
     * controllers, not closures, so `route:cache` keeps working. Route files can do the same with
     * `Tungsten::routes('{id}', fn () => ...)`, sets with their `routes()`.
     */
    public function routes(Closure $routes): self
    {
        $this->routes = $routes;

        return $this;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    /**
     * The panel's own routes: every set's `routes()`, then `->routes()`. Called inside the panel's route group.
     */
    public function registerRoutes(): void
    {
        if ($this->getGlobalSearches() !== []) {
            app('router')->get('search', GlobalSearchController::class)->name('search');
        }

        if ($this->profile !== null) {
            app('router')->get('profile', [ProfileController::class, 'show'])->name('profile');
            app('router')->put('profile', [ProfileController::class, 'update'])->name('profile.update');
            app('router')->put('profile/password', [ProfileController::class, 'password'])->name('profile.password');

            if ($this->login?->twoFactor !== null) {
                app('router')->post('profile/two-factor/recovery-codes', [TwoFactorProfileController::class, 'regenerate'])->name('profile.two-factor.recovery-codes');
                app('router')->delete('profile/two-factor', [TwoFactorProfileController::class, 'destroy'])->name('profile.two-factor.destroy');
            }
        }

        if ($this->notificationPoll !== null) {
            app('router')->get('notifications', [NotificationController::class, 'index'])->name('notifications');
            app('router')->post('notifications/read', [NotificationController::class, 'readAll'])->name('notifications.read-all');
            app('router')->post('notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
        }

        foreach ($this->getSets() as $set) {
            $set::routes();
        }

        $this->routes?->__invoke();
    }

    public function homeUrl(): string
    {
        return url($this->path);
    }

    public function owns(?Route $route): bool
    {
        return $route !== null && str_starts_with((string) $route->getName(), "{$this->id}.");
    }
}
