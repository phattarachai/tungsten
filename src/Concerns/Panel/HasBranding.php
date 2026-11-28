<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Concerns\Panel;

use Illuminate\Support\Str;
use InvalidArgumentException;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\RouteMeta;

/**
 * A {@see Panel}'s chrome: switcher chip, sidebar tint, brand, accent colour and layout defaults.
 */
trait HasBranding
{
    private string $description = '';

    private string $short = '';

    private ?string $icon = null;

    private string $color = '#52525b';

    private ?string $rail = null;

    /**
     * @var array<string, mixed>
     */
    private array $layout = [];

    private ?string $filterLayout = null;

    private ?string $brandColor = null;

    /**
     * @var array{label: string, icon: ?string, tag: ?string, logo: ?string}|null
     */
    private ?array $brand = null;

    private bool $business = false;

    private ?string $replaces = null;

    public function description(string $description): self
    {
        $this->description = $description;

        return $this;
    }

    /**
     * The 1–2 letters the switcher chip shows when the panel has no icon.
     */
    public function short(string $short): self
    {
        $this->short = $short;

        return $this;
    }

    public function icon(string $icon): self
    {
        $this->icon = $icon;

        return $this;
    }

    /**
     * The switcher chip's colour.
     */
    public function color(string $color): self
    {
        $this->color = $color;

        return $this;
    }

    /**
     * The sidebar background, a dark tint so panels tell apart at a glance.
     */
    public function rail(string $rail): self
    {
        $this->rail = $rail;

        return $this;
    }

    /**
     * Panel-wide AppLayout defaults (`sheet`, `flush`, `width`, `align`, `sidebar`, `topbar`, `className`,
     * `mainClassName`); a route's `->layout([...])` overrides them key by key, and a page's JSX props override both.
     *
     * @param  array<string, mixed>  $layout
     */
    public function layout(array $layout): self
    {
        $this->layout = RouteMeta::checkLayout($layout);

        return $this;
    }

    /**
     * How `<Filters>` lays out this panel's list filters, `bar` or `menu`; `tungsten.filter_layout` when unset.
     */
    public function filterLayout(string $layout): self
    {
        throw_unless(in_array($layout, ['bar', 'menu'], true), InvalidArgumentException::class, "Filter layout must be 'bar' or 'menu', got '{$layout}'.");

        $this->filterLayout = $layout;

        return $this;
    }

    /**
     * The accent colour, set inline on the panel's <html>; `tungsten.brand_color` when unset. With neither, the
     * stylesheet's `--color-brand` token applies, so a host can theme it in CSS alone.
     */
    public function brandColor(string $color): self
    {
        $this->brandColor = $color;

        return $this;
    }

    /**
     * What the sidebar head and the login page show instead of the panel label: an app name, an optional tag such as
     * "v2", and the chip's mark: `$logo` (a single-colour SVG, a URL or a public path, drawn white on the panel colour)
     * else `$icon` else the panel's `short` letters.
     */
    public function brand(string $label, ?string $icon = null, ?string $tag = null, ?string $logo = null): self
    {
        $this->brand = ['label' => $label, 'icon' => $icon, 'tag' => $tag, 'logo' => $logo];

        return $this;
    }

    public function business(bool $business = true): self
    {
        $this->business = $business;

        return $this;
    }

    /**
     * The switcher entry this panel is migrating; the switcher draws it as a chip on that entry's row.
     */
    public function replaces(string $entryId): self
    {
        $this->replaces = $entryId;

        return $this;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getShort(): string
    {
        return $this->short !== '' ? $this->short : Str::upper(Str::substr($this->label, 0, 1));
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function getColor(): string
    {
        return $this->color;
    }

    public function getRail(): ?string
    {
        return $this->rail;
    }

    /**
     * @return array<string, mixed>
     */
    public function getLayout(): array
    {
        return $this->layout;
    }

    public function getFilterLayout(): string
    {
        $layout = $this->filterLayout ?? config('tungsten.filter_layout');

        return $layout === 'menu' ? 'menu' : 'bar';
    }

    public function getBrandColor(): ?string
    {
        $color = $this->brandColor ?? config('tungsten.brand_color');

        return is_string($color) && $color !== '' ? $color : null;
    }

    /**
     * The brand with its logo as a URL: a path goes through `asset()`, a full URL or a root path is kept.
     *
     * @return array{label: string, icon: ?string, tag: ?string, logo: ?string}|null
     */
    public function getBrand(): ?array
    {
        $logo = $this->brand['logo'] ?? null;

        if ($this->brand === null || $logo === null || str_starts_with($logo, '/') || str_contains($logo, '://')) {
            return $this->brand;
        }

        return [...$this->brand, 'logo' => asset($logo)];
    }

    public function isBusiness(): bool
    {
        return $this->business;
    }

    public function getReplaces(): ?string
    {
        return $this->replaces;
    }
}
