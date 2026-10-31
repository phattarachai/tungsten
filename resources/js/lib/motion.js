/**
 * See docs/theme.md — "Motion".
 */
let runningTransitions = 0

function markPageTransition(transition) {
    const root = document.documentElement

    runningTransitions += 1
    root.dataset.pageTransition = ''

    function done() {
        runningTransitions -= 1

        if (runningTransitions === 0) {
            delete root.dataset.pageTransition
        }
    }

    transition.finished.then(done, done)
}

function isPageChange(href, options) {
    const method = String(options.method ?? 'get').toLowerCase()

    if (method !== 'get' || options.async || options.prefetch || options.preserveState || options.only?.length || options.except?.length) {
        return false
    }

    if (!document.querySelector('.panel-shell') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false
    }

    return new URL(href, window.location.href).pathname !== window.location.pathname
}

export function pageTransitionOptions(href, options) {
    if (options.viewTransition || !isPageChange(href, options)) {
        return {}
    }

    return { viewTransition: markPageTransition }
}

export function popoverMotion(position) {
    return position?.bottom !== undefined ? 'animate-panel-lift' : 'animate-panel-drop'
}
