<?php

declare(strict_types=1);

use Illuminate\Filesystem\Filesystem;

afterEach(function (): void {
    $files = new Filesystem;
    $files->deleteDirectory(app_path('Panel'));
    $files->deleteDirectory(resource_path('js/pages/panel'));
    $files->delete([resource_path('js/tungsten.jsx'), resource_path('css/tungsten.css'), config_path('tungsten.php'), app_path('Providers/TungstenPanelProvider.php')]);
});

it('generates a list page controller with TableQuery and its JSX, and prints the route to declare', function (): void {
    $this->artisan('make:tungsten-page', ['name' => 'Orders/Index', '--model' => 'Order', '--label' => 'คำสั่งซื้อ'])
        ->expectsOutputToContain("Route::get('orders', IndexPage::class)->name('orders')->nav('คำสั่งซื้อ');")
        ->assertSuccessful();

    $php = file_get_contents(app_path('Panel/Pages/Orders/IndexPage.php'));
    $jsx = file_get_contents(resource_path('js/pages/panel/orders/Index.jsx'));

    expect($php)
        ->toContain('namespace App\\Panel\\Pages\\Orders;')
        ->toContain('use App\\Models\\Order;')
        ->toContain('class IndexPage extends Page')
        ->toContain("return 'panel/orders/Index';")
        ->toContain("'title' => 'คำสั่งซื้อ'")
        ->toContain('TableQuery::for(Order::query(), $request)')
        ->not->toContain('function path')
        ->not->toContain('{{')
        ->and($jsx)
        ->toContain("from '@tungsten'")
        ->toContain('export default function PanelOrdersIndex({ title, table })')
        ->toContain('PanelOrdersIndex.layout = (page) => <AppLayout>{page}</AppLayout>')
        ->not->toContain('{{');

    exec('php -l '.escapeshellarg(app_path('Panel/Pages/Orders/IndexPage.php')), $output, $status);
    expect($status)->toBe(0);

    expect(app('router')->getRoutes()->getByName('orders'))->toBeNull();
});

it('prints numeric-safe routes with a breadcrumb for record and form pages', function (string $name, string $route, string $class, string $component): void {
    $this->artisan('make:tungsten-page', ['name' => $name])
        ->expectsOutputToContain($route)
        ->assertSuccessful();

    expect(file_get_contents(app_path("Panel/Pages/{$class}.php")))->toContain("return '{$component}';")
        ->and(file_exists(resource_path("js/pages/{$component}.jsx")))->toBeTrue();
})->with([
    ['Orders/Show', "Route::get('orders/{order}', ShowPage::class)->name('orders.show')->whereNumber('order')->breadcrumb('Orders');", 'Orders/ShowPage', 'panel/orders/Show'],
    ['Orders/Edit', "Route::get('orders/{order}/edit', EditPage::class)->name('orders.edit')->whereNumber('order')->breadcrumb('Orders');", 'Orders/EditPage', 'panel/orders/Edit'],
    ['CustomerGroups/Create', "Route::get('customer-groups/create', CreatePage::class)->name('customer-groups.create')->breadcrumb('Customer Groups');", 'CustomerGroups/CreatePage', 'panel/customer-groups/Create'],
]);

it('takes an explicit --path for the printed route', function (): void {
    $this->artisan('make:tungsten-page', ['name' => 'Settings/General', '--path' => 'settings', '--label' => 'ตั้งค่า'])
        ->expectsOutputToContain("Route::get('settings', GeneralPage::class)->name('settings')->nav('ตั้งค่า');")
        ->assertSuccessful();

    expect(file_get_contents(app_path('Panel/Pages/Settings/GeneralPage.php')))->toContain("return 'panel/settings/General';");
});

it('refuses to overwrite an existing page without --force', function (): void {
    $this->artisan('make:tungsten-page', ['name' => 'Orders/Index'])->assertSuccessful();
    $this->artisan('make:tungsten-page', ['name' => 'Orders/Index'])->assertFailed();
    $this->artisan('make:tungsten-page', ['name' => 'Orders/Index', '--force' => true])->assertSuccessful();
});

it('installs the config, the Vite entry and the stylesheet, and prints the alias and npm steps', function (): void {
    $this->artisan('tungsten:install')
        ->expectsOutputToContain("'@tungsten': path.resolve(__dirname, 'vendor/phattarachai/tungsten/resources/js')")
        ->expectsOutputToContain('lucide-react')
        ->expectsOutputToContain('Tungsten::handleExceptions')
        ->assertSuccessful();

    expect(config_path('tungsten.php'))->toBeFile()
        ->and(file_get_contents(resource_path('js/tungsten.jsx')))->toContain('createTungstenApp')
        ->and(file_get_contents(resource_path('css/tungsten.css')))->toContain('vendor/phattarachai/tungsten/resources/css/tungsten.css')
        ->and(app_path('Providers/TungstenPanelProvider.php'))->not->toBeFile();
});

it('writes and registers a panel provider with --provider', function (): void {
    $providers = base_path('bootstrap/providers.php');
    $original = file_exists($providers) ? file_get_contents($providers) : null;
    file_put_contents($providers, "<?php\n\nreturn [\n];\n");

    try {
        $this->artisan('tungsten:install', ['--provider' => true])->assertSuccessful();

        expect(file_get_contents(app_path('Providers/TungstenPanelProvider.php')))->toContain('extends PanelProvider')
            ->and(file_get_contents($providers))->toContain('App\\Providers\\TungstenPanelProvider::class');
    } finally {
        $original === null ? unlink($providers) : file_put_contents($providers, $original);
    }
});
