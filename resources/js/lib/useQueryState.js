import { router, usePage } from '@inertiajs/react'

export function withQuery(url, key, value) {
    const target = new URL(url, window.location.origin)

    if (value === null || value === undefined) {
        target.searchParams.delete(key)
    } else {
        target.searchParams.set(key, value)
    }

    return target.pathname + target.search + target.hash
}

export function useQueryState(key, fallback = null) {
    const { url } = usePage()
    const value = new URL(url, window.location.origin).searchParams.get(key) ?? fallback

    function update(next) {
        router.replace({ url: withQuery(url, key, next === fallback ? null : next), preserveScroll: true, preserveState: true })
    }

    return [value, update]
}

export function useCarriedQuery(key) {
    const { url } = usePage()
    const value = new URL(url, window.location.origin).searchParams.get(key)

    return (href) => (href && value !== null ? withQuery(href, key, value) : href)
}

export function useHistoryPanel() {
    const [open, setOpen] = useQueryState('history')

    return [open !== null, (next) => setOpen(next ? '1' : null)]
}
