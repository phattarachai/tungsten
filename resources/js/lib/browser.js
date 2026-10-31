/**
 * SSR guards: the kit never touches `window`, `document` or storage at module scope or during render on the server.
 */
export const inBrowser = typeof window !== 'undefined'

export function readStorage(key) {
    try {
        return inBrowser ? window.localStorage.getItem(key) : null
    } catch {
        return null
    }
}

export function writeStorage(key, value) {
    try {
        if (inBrowser) {
            window.localStorage.setItem(key, value)
        }
    } catch {
        // storage unavailable — the value still applies for this page
    }
}

/** Parses a page URL (`usePage().url`, usually a path) without needing `window.location`. */
export function parseUrl(url) {
    return new URL(url ?? '/', 'http://tungsten.local')
}

export function pathOf(target) {
    return target.pathname + target.search + target.hash
}
