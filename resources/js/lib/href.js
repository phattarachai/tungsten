/**
 * Every kit prop that takes an `href` or form `action` accepts a string or a Wayfinder-style `{url, method}` object.
 * These read either shape; the kit never depends on Wayfinder itself.
 */
export function urlOf(target) {
    if (!target) {
        return null
    }

    return typeof target === 'string' ? target : (target.url ?? null)
}

export function methodOf(target, fallback = 'get') {
    return typeof target === 'object' && target?.method ? String(target.method).toLowerCase() : fallback
}

/** Props for an Inertia `<Link>`: `href`, plus `method` (and `as="button"`) when it isn't a GET. */
export function linkProps(target, fallbackMethod = 'get') {
    const method = methodOf(target, fallbackMethod)

    return method === 'get' ? { href: urlOf(target) } : { href: urlOf(target), method, as: 'button' }
}
