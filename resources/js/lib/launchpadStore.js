import { usePage } from '@inertiajs/react'
import { useEffect } from 'react'

const STORED_LIMIT = 10

/** The launchpad's lists in localStorage, one set per panel: `pinned`, `searched` (picked from results), `opened`. */
export function storageKey(scope, list) {
    return `tungsten:${scope ?? 'panel'}:launchpad-${list}`
}

export function readList(scope, list) {
    try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey(scope, list)) ?? '[]')

        return Array.isArray(stored) ? stored.slice(0, STORED_LIMIT) : []
    } catch {
        return []
    }
}

export function writeList(scope, list, items) {
    try {
        window.localStorage.setItem(storageKey(scope, list), JSON.stringify(items.slice(0, STORED_LIMIT)))
    } catch {
        // storage unavailable (private window, quota): the launchpad still works for this page
    }
}

/** A URL's path and query, so `route()`'s absolute URL and a page's relative one are the same item. */
export function sameUrl(a, b) {
    const key = (url) => {
        try {
            const parsed = new URL(url, window.location.origin)

            return parsed.origin === window.location.origin ? parsed.pathname + parsed.search : parsed.href
        } catch {
            return url
        }
    }

    return Boolean(a) && Boolean(b) && key(a) === key(b)
}

/** Puts `item` first in a list, dropping an older copy of the same URL. */
export function remember(scope, list, item) {
    writeList(scope, list, [item, ...readList(scope, list).filter((entry) => !sameUrl(entry.url, item.url))])
}

/** What a stored entry keeps: enough to draw its row again without asking the server. */
export function snapshot(entry) {
    const { kind, title, subtitle, url, external, icon, image } = entry

    return { kind, title, subtitle, url, external, icon, image }
}

/**
 * Lists the record a page shows under the launchpad's "เปิดล่าสุด" (`{ title, subtitle?, url, icon?, image? }`), and
 * refreshes a pinned copy of it, so a renamed record reads right. Call it on a record's show page.
 */
export function useRememberRecord(record) {
    const scope = usePage().props.panel?.id
    const url = record?.url
    const title = record?.title
    const subtitle = record?.subtitle

    useEffect(() => {
        if (!url || !title) {
            return
        }

        const entry = snapshot({ kind: 'record', ...record })

        remember(scope, 'opened', entry)
        writeList(
            scope,
            'pinned',
            readList(scope, 'pinned').map((item) => (sameUrl(item.url, url) ? { ...entry, url: item.url } : item)),
        )
        // The record's own fields are the dependency; a new object each render must not write again.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope, url, title, subtitle])
}
