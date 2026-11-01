export function cn(...parts) {
    return parts.filter(Boolean).join(' ')
}

const WIDTH = /(?:^|\s)(?:[\w@[\]-]+:)*!?(?:w|size|basis)-\S/

/**
 * A field's own width (`w-full` by default), or nothing when the caller's `className` sets one (`w-64`, `md:w-48`,
 * `w-[18rem]`, `size-8`, `basis-1/3` …) — `cn` only joins classes, so both would land and CSS order would pick.
 * `max-w-*` / `min-w-*` don't count: they bound the default width rather than replace it.
 */
export function widthUnless(className, own = 'w-full') {
    return WIDTH.test(className ?? '') ? null : own
}
