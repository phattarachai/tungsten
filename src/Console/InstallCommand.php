<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Console;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;

class InstallCommand extends Command
{
    public const string NPM_DEPENDENCIES = '@inertiajs/react@^3.9 react@^19 react-dom@^19 lucide-react@^1';

    protected $signature = 'tungsten:install
        {--provider : Also write app/Providers/TungstenPanelProvider.php and register it}
        {--force : Overwrite files that already exist}';

    protected $description = 'Publish the Tungsten config, write the Vite entry + stylesheet, and print the Vite and npm steps';

    public function handle(Filesystem $files): int
    {
        $this->call('vendor:publish', ['--tag' => 'tungsten-config', '--force' => $this->option('force')]);

        $this->write($files, 'tungsten.jsx.stub', base_path((string) config('tungsten.vite.entry')));
        $this->write($files, 'tungsten.css.stub', resource_path('css/tungsten.css'));

        if ($this->option('provider')) {
            $this->installProvider($files);
        }

        $this->printNextSteps();

        return self::SUCCESS;
    }

    private function write(Filesystem $files, string $stub, string $target): void
    {
        if ($files->exists($target) && ! $this->option('force')) {
            $this->components->twoColumnDetail($this->relative($target), '<fg=yellow>exists, left alone</>');

            return;
        }

        $files->ensureDirectoryExists(dirname($target));
        $files->copy(__DIR__."/../../stubs/{$stub}", $target);
        $this->components->twoColumnDetail($this->relative($target), '<fg=green>written</>');
    }

    private function installProvider(Filesystem $files): void
    {
        $this->write($files, 'panel-provider.php.stub', app_path('Providers/TungstenPanelProvider.php'));

        $providers = base_path('bootstrap/providers.php');

        if ($files->exists($providers) && ! str_contains($files->get($providers), 'TungstenPanelProvider')) {
            $files->put($providers, str_replace('];', "    App\\Providers\\TungstenPanelProvider::class,\n];", $files->get($providers)));
            $this->components->twoColumnDetail('bootstrap/providers.php', '<fg=green>TungstenPanelProvider added</>');
        }
    }

    private function printNextSteps(): void
    {
        $entry = (string) config('tungsten.vite.entry');

        $this->newLine();
        $this->components->info('Next steps');
        $this->line('1. npm dependencies (peer deps the kit imports):');
        $this->line('   <fg=cyan>npm install '.self::NPM_DEPENDENCIES.'</>');
        $this->line('   Build tools, if the app lacks them: tailwindcss@^4, @tailwindcss/vite@^4, laravel-vite-plugin, and the');
        $this->line('   @vitejs/plugin-react major that matches your Vite (^5 for Vite 7, ^6 for Vite 8).');
        $this->newLine();
        $this->line('2. vite.config.js — add the entry, the alias, and dedupe React for the vendor files:');
        $this->line(<<<JS
               laravel({ input: [..., '{$entry}'] }),
               react(),
               tailwindcss(),
               ...
               resolve: {
                   alias: { '@tungsten': path.resolve(__dirname, 'vendor/phattarachai/tungsten/resources/js') },
                   dedupe: ['react', 'react-dom', '@inertiajs/react', 'lucide-react'],
               },
           JS);
        $this->newLine();
        $this->line('3. bootstrap/app.php — panel error pages:');
        $this->line('   <fg=cyan>->withExceptions(fn (Exceptions $exceptions) => Tungsten::handleExceptions($exceptions))</>');
        $this->newLine();
        $this->line('4. Define each panel\'s gate (`access{Id}` by default, e.g. Gate::define(\'accessAdmin\', ...)) or call ->ability(null).');
        $this->newLine();
        $this->line('5. Declare routes — plain Laravel, in a PanelSet::routes() or a route file:');
        $this->line("   <fg=cyan>Tungsten::routes('admin', fn () => Route::get('orders', OrdersPage::class)->name('orders')->nav('คำสั่งซื้อ'));</>");
    }

    private function relative(string $path): string
    {
        return ltrim(str_replace(base_path(), '', $path), '/');
    }
}
