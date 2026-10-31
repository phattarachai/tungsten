import { createInertiaApp, router } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

import { pageTransitionOptions } from './lib/motion'

const KIT_PAGES = import.meta.glob('./pages/**/*.jsx')
const KIT_PREFIX = 'tungsten::'

function brandColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim() || '#ba1a1a'
}

async function resolvePage(name, pages, prefix) {
    const kit = name.startsWith(KIT_PREFIX)
    const path = kit ? `./pages/${name.slice(KIT_PREFIX.length)}.jsx` : `${prefix}${name}.jsx`
    const load = (kit ? KIT_PAGES : pages)[path]

    if (!load) {
        throw new Error(`Tungsten: page [${name}] not found at ${path}.`)
    }

    const module = await load()

    return module.default ?? module
}

/**
 * Boots the panel's Inertia app. `pages` is the host's `import.meta.glob(...)` of its page files; `prefix` maps a
 * component name to a glob key (`panel/orders/Index` → `./pages/panel/orders/Index.jsx`). Kit pages
 * (`tungsten::Home`, the error page, the UI Kit) resolve from the package itself.
 */
export function createTungstenApp({ pages = {}, prefix = './pages/', appName = import.meta.env.VITE_APP_NAME, progress, setup, ...options } = {}) {
    // A non-GET visit (a save) can change any list, so drop every prefetched page; Inertia only drops the one it lands on.
    router.on('finish', (event) => {
        if (event.detail.visit.method !== 'get') {
            router.flushAll()
        }
    })

    return createInertiaApp({
        title: (title) => (title && appName ? `${title} — ${appName}` : title || appName || ''),
        resolve: (name) => resolvePage(name, pages, prefix),
        setup:
            setup ??
            (({ el, App, props }) => {
                createRoot(el).render(<App {...props} />)
            }),
        progress: progress ?? { color: brandColor() },
        defaults: { visitOptions: pageTransitionOptions },
        ...options,
    })
}
