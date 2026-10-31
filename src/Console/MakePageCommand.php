<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Console;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;

class MakePageCommand extends Command
{
    protected $signature = 'make:tungsten-page
        {name : Area/Name, e.g. Orders/Index, Orders/Show, Settings/General}
        {--path= : The URL path under the panel (derived from the name when left out)}
        {--model= : For a list page: the model TableQuery lists (e.g. Order or App\\Models\\Order)}
        {--label= : The sidebar label}
        {--force : Overwrite files that already exist}';

    protected $description = 'Create a Tungsten page: the PHP page class and its JSX component';

    public function handle(Filesystem $files): int
    {
        $segments = collect(explode('/', str_replace('\\', '/', trim((string) $this->argument('name'), '/'))))
            ->map(fn (string $segment): string => Str::studly($segment));

        $name = (string) $segments->pop();
        $area = $segments->implode('/');
        $class = Str::finish($name, 'Page');
        $component = $this->component($area, Str::beforeLast($class, 'Page') ?: $name);
        $path = $this->option('path') ?? $this->path($area, Str::beforeLast($class, 'Page'));
        $model = $this->model();
        $list = $model !== null;

        $replacements = [
            '{{ namespace }}' => collect([config('tungsten.generator.namespace'), ...$segments])->implode('\\'),
            '{{ class }}' => $class,
            '{{ path }}' => trim((string) $path, '/'),
            '{{ component }}' => $component,
            '{{ label }}' => $this->option('label') ?? Str::headline($area !== '' ? Str::afterLast($area, '/') : $name),
            '{{ inNavigation }}' => str_contains((string) $path, '{') || in_array(Str::beforeLast($class, 'Page'), ['Create', 'Edit'], true) ? 'false' : 'true',
            '{{ modelClass }}' => $model ?? '',
            '{{ model }}' => $model === null ? '' : class_basename($model),
            '{{ function }}' => Str::studly(str_replace('/', ' ', $component)),
        ];

        $phpTarget = app_path(collect([config('tungsten.generator.classes'), ...$segments, "{$class}.php"])->implode('/'));
        $jsxTarget = base_path(config('tungsten.vite.pages')."/{$component}.jsx");

        $wrote = $this->write($files, $list ? 'page.list.php.stub' : 'page.php.stub', $phpTarget, $replacements)
            & $this->write($files, $list ? 'page.list.jsx.stub' : 'page.jsx.stub', $jsxTarget, $replacements);

        $this->components->info("List {$replacements['{{ namespace }}']}\\{$class}::class in a PanelSet's pages() (or the panel's ->pages()) to route it.");

        return $wrote ? self::SUCCESS : self::FAILURE;
    }

    private function component(string $area, string $name): string
    {
        $directory = collect(explode('/', $area))->filter()->map(fn (string $segment): string => Str::kebab($segment))->implode('/');

        return collect([config('tungsten.generator.components'), $directory, $name])->filter()->implode('/');
    }

    private function path(string $area, string $name): string
    {
        $base = collect(explode('/', $area))->filter()->map(fn (string $segment): string => Str::kebab($segment))->implode('/');
        $parameter = '{'.Str::camel(Str::singular(Str::afterLast($area, '/') ?: 'record')).'}';

        return trim(match ($name) {
            'Index', 'List' => $base,
            'Create' => "{$base}/create",
            'Show', 'View' => "{$base}/{$parameter}",
            'Edit' => "{$base}/{$parameter}/edit",
            default => "{$base}/".Str::kebab($name),
        }, '/');
    }

    private function model(): ?string
    {
        $model = $this->option('model');

        if (! is_string($model) || $model === '') {
            return null;
        }

        return str_contains($model, '\\') ? ltrim($model, '\\') : "App\\Models\\{$model}";
    }

    /**
     * @param  array<string, string>  $replacements
     */
    private function write(Filesystem $files, string $stub, string $target, array $replacements): bool
    {
        $relative = ltrim(str_replace(base_path(), '', $target), '/');

        if ($files->exists($target) && ! $this->option('force')) {
            $this->components->error("{$relative} already exists (--force to overwrite).");

            return false;
        }

        $files->ensureDirectoryExists(dirname($target));
        $files->put($target, strtr($files->get(__DIR__."/../../stubs/{$stub}"), $replacements));
        $this->components->twoColumnDetail($relative, '<fg=green>created</>');

        return true;
    }
}
