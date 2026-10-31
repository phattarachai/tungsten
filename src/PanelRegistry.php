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

    /**
     * @var list<array{label: string, url: string, icon: ?string, image: ?string, ability: ?string}>
     */
    private array $links = [];

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
     * An app-wide link at the foot of the switcher menu (the store front, a BI tool): a small icon or image, the label
     * and ↗; it always opens a new tab. `$image` / `$url` may be a public path or a full URL.
     */
    public function link(string $label, string $url, ?string $icon = null, ?string $image = null, ?string $ability = null): self
    {
        $this->links[] = compact('label', 'url', 'icon', 'image', 'ability');

        return $this;
    }

    /**
     * The footer links `$user` may see, shared as `panel_links`.
     *
     * @return list<array{label: string, url: string, icon: ?string, image: ?string}>
     */
    public function linksFor(?Authenticatable $user): array
    {
        return collect($this->links)
            ->filter(fn (array $link): bool => $link['ability'] === null || ($user !== null && Gate::forUser($user)->allows($link['ability'])))
            ->map(fn (array $link): array => [
                'label' => $link['label'],
                'url' => $this->absolute($link['url']),
                'icon' => $link['icon'],
                'image' => $link['image'] === null ? null : $this->absolute($link['image'], asset: true),
            ])
            ->values()
            ->all();
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
     * Registered set classes that don't exist, per panel — assert this is empty in a host test.
     *
     * @return array<string, list<string>>
     */
    public function missingClasses(): array
    {
        return collect($this->panels)
            ->map(fn (Panel $panel): array => $panel->missingSets())
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
            'url' => $this->absolute($entry['url']),
            'short' => $entry['short'],
            'icon' => $entry['icon'],
            'color' => $entry['color'],
            'current' => $entry['id'] === $currentId,
            'divider_after' => false,
            'replaces' => $entry['replaces'] ?? null,
        ];
    }

    private function absolute(string $url, bool $asset = false): string
    {
        return match (true) {
            str_contains($url, '://') || str_starts_with($url, '//') => $url,
            $asset => asset($url),
            default => url($url),
        };
    }
}
