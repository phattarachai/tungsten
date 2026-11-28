<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Concerns\Panel;

use Illuminate\Support\Str;
use Phattarachai\Tungsten\Exceptions\MissingPageClass;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelSet;
use Symfony\Component\Finder\Finder;

/**
 * The {@see PanelSet}s a {@see Panel} is built from.
 */
trait HasSets
{
    /**
     * @var list<string>
     */
    private array $sets = [];

    /**
     * @var list<string>|null
     */
    private ?array $resolvedSets = null;

    /**
     * @param  list<class-string<PanelSet>>  $sets
     */
    public function sets(array $sets): self
    {
        $this->sets = [...$this->sets, ...$sets];
        $this->resolvedSets = null;

        return $this;
    }

    /**
     * Every {@see PanelSet} subclass in a directory, e.g. `->discoverSets(app_path('Panel/Sets'), 'App\\Panel\\Sets')`.
     */
    public function discoverSets(string $directory, string $namespace): self
    {
        if (! is_dir($directory)) {
            return $this;
        }

        $sets = collect(Finder::create()->files()->name('*.php')->in($directory)->sortByName())
            ->map(fn (\SplFileInfo $file): string => $namespace.'\\'.str_replace(['/', '.php'], ['\\', ''], Str::after($file->getPathname(), rtrim($directory, '/').'/')))
            ->filter(fn (string $class): bool => is_subclass_of($class, PanelSet::class) && ! new \ReflectionClass($class)->isAbstract())
            ->values()
            ->all();

        return $this->sets($sets);
    }

    /**
     * Sets whose class exists; a missing one is skipped and reported, never fatal.
     *
     * @return list<string>
     */
    public function getSets(): array
    {
        return $this->resolvedSets ??= array_values(array_filter($this->sets, $this->setExists(...)));
    }

    /**
     * @return list<string>
     */
    public function missingSets(): array
    {
        return array_values(array_filter($this->sets, fn (string $set): bool => ! class_exists($set)));
    }

    private function setExists(string $class): bool
    {
        if (class_exists($class)) {
            return true;
        }

        report(new MissingPageClass("Tungsten panel [{$this->id}] lists set [{$class}], which does not exist; it was skipped."));

        return false;
    }
}
