<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Tests;

use Illuminate\Auth\GenericUser;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Inertia\ServiceProvider as InertiaServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;
use Override;
use Phattarachai\Tungsten\Http\Controllers\UiKitToastController;
use Phattarachai\Tungsten\Pages\HomePage;
use Phattarachai\Tungsten\Pages\UiKitPage;
use Phattarachai\Tungsten\Tests\Fixtures\AdminPanelProvider;
use Phattarachai\Tungsten\Tests\Fixtures\ToolsPanelProvider;
use Phattarachai\Tungsten\Tungsten;
use Phattarachai\Tungsten\TungstenServiceProvider;

abstract class TestCase extends Orchestra
{
    #[Override]
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        Gate::define('accessAdmin', fn (GenericUser $user): bool => $user->getAuthIdentifier() < 100);
        Gate::define('accessTools', fn (GenericUser $user): bool => $user->getAuthIdentifier() === 1);
        Gate::define('viewReports', fn (GenericUser $user): bool => $user->getAuthIdentifier() === 1);
    }

    #[Override]
    protected function getPackageProviders($app): array
    {
        return [
            InertiaServiceProvider::class,
            TungstenServiceProvider::class,
            AdminPanelProvider::class,
            ToolsPanelProvider::class,
        ];
    }

    #[Override]
    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('inertia.testing.ensure_pages_exist', false);
        $app['config']->set('app.debug', false);
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('t', 32)));
    }

    #[Override]
    protected function defineRoutes($router): void
    {
        $router->get('login', fn (): string => 'login')->name('login');
        $router->post('logout', fn (): string => 'bye')->name('logout');

        Tungsten::routes('admin', function () use ($router): void {
            $router->get('/', HomePage::class)->name('dashboard')->nav('หน้าหลัก', icon: 'layout-grid', sort: -1);
            $router->get('ui-kit', UiKitPage::class)->name('ui-kit')->nav('UI Kit', icon: 'palette', sort: 1000);
            $router->post('ui-kit/toast', UiKitToastController::class)->name('ui-kit.toast');
        });

        Tungsten::routes('tools', function () use ($router): void {
            $router->get('/', HomePage::class)->name('dashboard');
        });
    }

    #[Override]
    protected function defineDatabaseMigrations(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
        });

        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->string('number');
            $table->foreignId('customer_id')->nullable();
            $table->string('status');
            $table->integer('total')->nullable();
            $table->timestamps();
        });
    }

    protected function admin(int $id = 1): GenericUser
    {
        return new GenericUser(['id' => $id, 'name' => "Admin {$id}", 'email' => "admin{$id}@example.com", 'remember_token' => null]);
    }
}
