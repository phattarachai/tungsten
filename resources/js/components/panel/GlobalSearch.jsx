import { usePage } from '@inertiajs/react'

import { Launchpad } from './Launchpad'

/**
 * The topbar's search (`Panel::globalSearch()` / a set's `searches()`): the {@link Launchpad} over the panel's menus
 * (the shared `nav`) and its records at `url`, its pinned and recent items kept per panel.
 */
export function GlobalSearch({ url, nav, scope, ...props }) {
    const shared = usePage().props

    return <Launchpad url={url} nav={nav ?? shared.nav} scope={scope ?? shared.panel?.id} {...props} />
}
