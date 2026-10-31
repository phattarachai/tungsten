<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Listeners;

use Illuminate\Routing\Events\PreparingResponse;
use Inertia\Response as InertiaResponse;
use Phattarachai\Tungsten\Exceptions\ReservedPropName;
use Phattarachai\Tungsten\Http\Middleware\HandleTungstenRequests;

/**
 * Stops a panel page from returning a prop the panel shares. Inertia lets page props win over shared ones, so a page
 * prop named `panels` silently replaces the panel switcher's list and the shell crashes. Throws while debugging,
 * reports otherwise. `breadcrumbs` and `layout` stay overridable on purpose.
 */
class GuardReservedProps
{
    public const array RESERVED = ['auth', 'panel', 'panels', 'panel_links', 'nav', 'flash', 'errors'];

    public function handle(PreparingResponse $event): void
    {
        $response = $event->response;

        if (! $response instanceof InertiaResponse || ! $event->request->attributes->has(HandleTungstenRequests::PANEL)) {
            return;
        }

        $clashes = array_values(array_intersect(self::RESERVED, $this->propNames($response)));

        if ($clashes === []) {
            return;
        }

        $exception = ReservedPropName::on($this->component($response), $clashes);

        throw_if(config('app.debug'), $exception);

        report($exception);
    }

    /**
     * @return list<string>
     */
    private function propNames(InertiaResponse $response): array
    {
        /** @var array<array-key, mixed> $props */
        $props = (fn (): array => $this->props)->call($response);

        return array_values(array_filter(array_keys($props), is_string(...)));
    }

    private function component(InertiaResponse $response): string
    {
        return (string) (fn (): string => $this->component)->call($response);
    }
}
