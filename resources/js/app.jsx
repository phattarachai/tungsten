import { createInertiaApp, router } from '@inertiajs/react'

import { inBrowser } from './lib/browser'
import { pageTransitionOptions } from './lib/motion'

const KIT_PAGES = import.meta.glob('./pages/**/*.jsx')
const KIT_PREFIX = 'tungsten::'

function brandColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim() || '#ba1a1a'
}

/**
 * Resolves a page name: `tungsten::…` from the kit's own pages, anything else from the host's `pages` glob
 * (`panel/orders/Index` → `${prefix}panel/orders/Index.jsx`). Use it directly in an SSR entry.
 */
export function tungstenResolver({ pages = {}, prefix = './pages/' } = {}) {
    return async (name) => {
        const kit = name.startsWith(KIT_PREFIX)
        const path = kit ? `./pages/${name.slice(KIT_PREFIX.length)}.jsx` : `${prefix}${name}.jsx`
        const load = (kit ? KIT_PAGES : pages)[path]

        if (!load) {
            throw new Error(`Tungsten: page [${name}] not found at ${path}.`)
        }

        return load()
    }
}

/**
 * Boots the panel's Inertia app — a thin wrapper over `createInertiaApp` that adds the kit's page resolver, title,
 * progress colour, page transitions and prefetch flushing. Every other option passes through (`setup`, `withApp`,
 * `page` + `render` for SSR …). Inertia hydrates server-rendered HTML by itself.
 *
 *     createTungstenApp({ pages: import.meta.glob('./pages/panel/**\/*.jsx') })
 */
export function createTungstenApp({ pages = {}, prefix = './pages/', appName = import.meta.env.VITE_APP_NAME, progress, ...options } = {}) {
    if (inBrowser) {
        // A non-GET visit (a save) can change any list, so drop every prefetched page; Inertia only drops the one it lands on.
        router.on('finish', (event) => {
            if (event.detail.visit.method !== 'get') {
                router.flushAll()
            }
        })
    }

    return createInertiaApp({
        title: (title) => (title && appName ? `${title} — ${appName}` : title || appName || ''),
        resolve: tungstenResolver({ pages, prefix }),
        progress: progress ?? (inBrowser ? { color: brandColor() } : false),
        defaults: { visitOptions: pageTransitionOptions },
        // Server rendering with `page` + `render` needs a setup; in the browser Inertia picks hydrate or render itself.
        ...(inBrowser ? {} : { setup: ({ App, props }) => <App {...props} /> }),
        ...options,
    })
}
