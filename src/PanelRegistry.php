<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Gate;

/**
 * Every Tungsten panel, plus the switcher entries for screens that aren't Tungsten panels (an old admin).
 *
 * @see docs/kernel.md
 */
class PanelRegistry
{
    /**
     * @var array<string, Panel>
     */
    private array $panels = [];

    /**
     * @var list<array{id: string, label: string, description: string, url: string, short: string, icon: ?string, color: string, business: bool, ability: ?string}>
     */
    private array $entries = [];

    public function register(Panel $panel): self
    {
        $this->panels[$panel->getId()] = $panel;

        return $this;
    }

    /**
     * A switcher row for something that isn't a Tungsten panel, e.g. the Filament admin a panel `replaces()`.
     */
    public function entry(string $id, string $label, string $url, string $description = '', string $short = '', ?string $icon = null, string $color = '#52525b', bool $business = true, ?string $ability = null): self
    {
        $this->entries[] = compact('id', 'label', 'description', 'url', 'short', 'icon', 'color', 'business', 'ability');

        return $this;
    }

    /**
     * @return array<string, Panel>
     */
    public function all(): array
    {
        return $this->panels;
    }

    public function find(string $id): ?Panel
    {
        return $this->panels[$id] ?? null;
    }

    public function forRoute(?string $routeName): ?Panel
    {
        return $this->find(str($routeName ?? '')->before('.')->value());
    }

    public function pageForRoute(?string $routeName): ?Page
    {
        return $this->forRoute($routeName)?->pageForRoute($routeName);
    }

    /**
     * The panel menu: business panels and entries first, then (after a divider) tool panels, each only if the user
     * passes its ability.
     *
     * @return list<array{id: string, label: string, description: string, url: string, short: string, icon: ?string, color: string, current: bool, divider_after: bool, replaces: ?string}>
     */
    public function switcherFor(?Authenticatable $user, ?string $currentId): array
    {
        $allowed = fn (?string $ability): bool => $ability === null || ($user !== null && Gate::forUser($user)->allows($ability));

        [$business, $tools] = collect($this->panels)
            ->filter(fn (Panel $panel): bool => $allowed($panel->getAbility()))
            ->partition(fn (Panel $panel): bool => $panel->isBusiness() || $panel->getReplaces() !== null);

        $extra = collect($this->entries)->filter(fn (array $entry): bool => $allowed($entry['ability']));

        $rows = [
            ...$extra->where('business', true)->map(fn (array $entry): array => $this->row($entry, $currentId))->values(),
            ...$business->map(fn (Panel $panel): array => $this->panelRow($panel, $currentId))->values(),
        ];

        $tail = [
            ...$tools->map(fn (Panel $panel): array => $this->panelRow($panel, $currentId))->values(),
            ...$extra->where('business', false)->map(fn (array $entry): array => $this->row($entry, $currentId))->values(),
        ];

        if ($rows !== [] && $tail !== []) {
            $lastRow = collect($rows)->whereNull('replaces')->keys()->last() ?? array_key_last($rows);
            $rows[$lastRow]['divider_after'] = true;
        }

        return [...$rows, ...$tail];
    }

    /**
     * Registered page or set classes that don't exist, per panel — assert this is empty in a host test.
     *
     * @return array<string, list<string>>
     */
    public function missingClasses(): array
    {
        return collect($this->panels)
            ->map(fn (Panel $panel): array => $panel->missingClasses())
            ->filter()
            ->all();
    }

    /**
     * @return array{id: string, label: string, description: string, url: string, short: string, icon: ?string, color: string, current: bool, divider_after: bool, replaces: ?string}
     */
    private function panelRow(Panel $panel, ?string $currentId): array
    {
        return $this->row([
            'id' => $panel->getId(),
            'label' => $panel->getLabel(),
            'description' => $panel->getDescription(),
            'url' => $panel->homeUrl(),
            'short' => $panel->getShort(),
            'icon' => $panel->getIcon(),
            'color' => $panel->getColor(),
            'replaces' => $panel->getReplaces(),
        ], $currentId);
    }

    /**
     * @param  array{id: string, label: string, description: string, url: string, short: string, icon: ?string, color: string, replaces?: ?string}  $entry
     * @return array{id: string, label: string, description: string, url: string, short: string, icon: ?string, color: string, current: bool, divider_after: bool, replaces: ?string}
     */
    private function row(array $entry, ?string $currentId): array
    {
        return [
            'id' => $entry['id'],
            'label' => $entry['label'],
            'description' => $entry['description'],
            'url' => str_starts_with($entry['url'], 'http') ? $entry['url'] : url($entry['url']),
            'short' => $entry['short'],
            'icon' => $entry['icon'],
            'color' => $entry['color'],
            'current' => $entry['id'] === $currentId,
            'divider_after' => false,
            'replaces' => $entry['replaces'] ?? null,
        ];
    }
}
