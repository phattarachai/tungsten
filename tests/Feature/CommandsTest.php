<?php

declare(strict_types=1);

use Illuminate\Filesystem\Filesystem;

afterEach(function (): void {
    $files = new Filesystem;
    $files->deleteDirectory(app_path('Panel'));
    $files->deleteDirectory(resource_path('js/pages/panel'));
    $files->delete([resource_path('js/tungsten.jsx'), resource_path('css/tungsten.css'), config_path('tungsten.php'), app_path('Providers/TungstenPanelProvider.php')]);
});

it('generates a list page class with TableQuery and its JSX with the table kit', function (): void {
    $this->artisan('make:tungsten-page', ['name' => 'Orders/Index', '--model' => 'Order', '--label' => 'คำสั่งซื้อ'])->assertSuccessful();

    $php = file_get_contents(app_path('Panel/Pages/Orders/IndexPage.php'));
    $jsx = file_get_contents(resource_path('js/pages/panel/orders/Index.jsx'));

    expect($php)
        ->toContain('namespace App\\Panel\\Pages\\Orders;')
        ->toContain('use App\\Models\\Order;')
        ->toContain('class IndexPage extends Page')
        ->toContain("return 'orders';")
        ->toContain("return 'panel/orders/Index';")
        ->toContain("return 'คำสั่งซื้อ';")
        ->toContain('TableQuery::for(Order::query(), $request)')
        ->not->toContain('{{')
        ->and($jsx)
        ->toContain("from '@tungsten'")
        ->toContain('export default function PanelOrdersIndex({ title, table })')
        ->toContain('PanelOrdersIndex.layout = (page) => <AppLayout>{page}</AppLayout>')
        ->not->toContain('{{');

    exec('php -l '.escapeshellarg(app_path('Panel/Pages/Orders/IndexPage.php')), $output, $status);
    expect($status)->toBe(0);
});

it('derives detail, create and edit paths with a numeric-safe parameter and keeps them out of the nav', function (string $name, string $path, string $class, string $component): void {
    $this->artisan('make:tungsten-page', ['name' => $name])->assertSuccessful();

    $php = file_get_contents(app_path("Panel/Pages/{$class}.php"));

    expect($php)->toContain("return '{$path}';")
        ->toContain("return '{$component}';")
        ->toContain('return false;')
        ->and(file_exists(resource_path("js/pages/{$component}.jsx")))->toBeTrue();
})->with([
    ['Orders/Show', 'orders/{order}', 'Orders/ShowPage', 'panel/orders/Show'],
    ['Orders/Edit', 'orders/{order}/edit', 'Orders/EditPage', 'panel/orders/Edit'],
    ['CustomerGroups/Create', 'customer-groups/create', 'CustomerGroups/CreatePage', 'panel/customer-groups/Create'],
]);

it('generates a plain page that shows in the nav, and an explicit --path', function (): void {
    $this->artisan('make:tungsten-page', ['name' => 'Settings/General', '--path' => 'settings'])->assertSuccessful();

    expect(file_get_contents(app_path('Panel/Pages/Settings/GeneralPage.php')))
        ->toContain("return 'settings';")
        ->toContain('return true;')
        ->toContain("return 'panel/settings/General';");
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
