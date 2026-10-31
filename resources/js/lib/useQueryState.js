import { router, usePage } from '@inertiajs/react'

import { parseUrl, pathOf } from './browser'
import { urlOf } from './href'

export function withQuery(url, key, value) {
    const target = parseUrl(urlOf(url))

    if (value === null || value === undefined) {
        target.searchParams.delete(key)
    } else {
        target.searchParams.set(key, value)
    }

    return pathOf(target)
}

export function useQueryState(key, fallback = null) {
    const { url } = usePage()
    const value = parseUrl(url).searchParams.get(key) ?? fallback

    function update(next) {
        router.replace({ url: withQuery(url, key, next === fallback ? null : next), preserveScroll: true, preserveState: true })
    }

    return [value, update]
}

/** Carries `key` from the current URL onto `href` (a string or `{url, method}`), keeping its shape. */
export function useCarriedQuery(key) {
    const { url } = usePage()
    const value = parseUrl(url).searchParams.get(key)

    return (href) => {
        if (!href || value === null) {
            return href
        }

        return typeof href === 'string' ? withQuery(href, key, value) : { ...href, url: withQuery(href, key, value) }
    }
}

export function useHistoryPanel() {
    const [open, setOpen] = useQueryState('history')

    return [open !== null, (next) => setOpen(next ? '1' : null)]
}
