/**
 * The bell's decisions as pure functions (no DOM, no clock of their own): which items are new, what the toast stack
 * holds, when to poll next, what an answer means. noticeStore.js carries them out.
 */

/** How many items the server sends at most (NotificationController::LATEST). */
export const WINDOW = 20

export const MAX_TOASTS = 3

export const TOAST_SECONDS = 8

const HIDDEN_POLL_SECONDS = 60
const MAX_BACKOFF_SECONDS = 300
const CLAIM_MS = 24 * 60 * 60 * 1000
const MAX_CLAIMS = 200

const time = (item) => (item.at ? Date.parse(item.at) : Infinity)

/**
 * Takes one answer's items into what is already known: `{ tracker, fresh }`, `fresh` the unread items that arrived
 * since the first answer (which only sets the baseline), newest first. An id is new once, whatever its text says
 * later; an older item that slides into the window when another is deleted is not new.
 */
export function intake(tracker, items) {
    if (!tracker) {
        const floor = items.length === 0 ? -Infinity : Math.min(...items.map(time))

        return { tracker: { seen: new Set(items.map((item) => item.id)), floor, full: items.length >= WINDOW }, fresh: [] }
    }

    const arrived = (item) => time(item) > tracker.floor || (time(item) === tracker.floor && !tracker.full)
    const fresh = items.filter((item) => !item.read && !tracker.seen.has(item.id) && arrived(item))

    return { tracker: { ...tracker, seen: new Set([...tracker.seen, ...items.map((item) => item.id)]) }, fresh }
}

export const NO_TOASTS = Object.freeze({ shown: [], more: 0 })

const tidy = (stack) => (stack.shown.length === 0 ? NO_TOASTS : stack)

/** Puts `fresh` (newest first) on the stack: the newest three stay, the rest (`total` of them arrived) are counted. */
export function pushToasts(stack, fresh, now, total = fresh.length) {
    if (fresh.length === 0) {
        return stack
    }

    const leaving = stack.shown.filter((toast) => toast.leaving)
    const all = [...fresh.map((item) => ({ item, born: now, until: now + TOAST_SECONDS * 1000, leaving: false })), ...stack.shown.filter((toast) => !toast.leaving)]

    return { shown: [...all.slice(0, MAX_TOASTS), ...leaving], more: stack.more + Math.max(0, all.length - MAX_TOASTS) + Math.max(0, total - fresh.length) }
}

/** Starts a toast's way out; `removeLeft` takes it off once it has slid away. */
export function dismissToast(stack, id) {
    return { ...stack, shown: stack.shown.map((toast) => (toast.item.id === id ? { ...toast, leaving: true } : toast)) }
}

export function expireToasts(stack, now) {
    return { ...stack, shown: stack.shown.map((toast) => (toast.until <= now ? { ...toast, leaving: true } : toast)) }
}

/** Gives every toast its full time again, after a pause (pointer on the stack, tab behind). */
export function extendToasts(stack, now) {
    return { ...stack, shown: stack.shown.map((toast) => ({ ...toast, until: now + TOAST_SECONDS * 1000 })) }
}

export function removeLeft(stack) {
    return tidy({ ...stack, shown: stack.shown.filter((toast) => !toast.leaving) })
}

/** Follows the server: an edited item shows its new text, one read elsewhere leaves. */
export function syncToasts(stack, items) {
    if (stack.shown.length === 0) {
        return stack
    }

    const known = new Map(items.map((item) => [item.id, item]))

    return {
        ...stack,
        shown: stack.shown.map((toast) => {
            const item = known.get(toast.item.id)

            return item ? { ...toast, item, leaving: toast.leaving || item.read } : toast
        }),
    }
}

/**
 * Seconds to the next poll, or null for none: `poll` apart, doubling with each failure in a row; behind another tab
 * only with `background`, once a minute.
 */
export function pollDelay({ poll, failures = 0, hidden = false, background = false }) {
    if (hidden && !background) {
        return null
    }

    const delay = failures === 0 ? poll : Math.max(poll, Math.min(poll * 2 ** failures, MAX_BACKOFF_SECONDS))

    return hidden ? Math.max(delay, HIDDEN_POLL_SECONDS) : delay
}

const isBell = (body) => typeof body?.unread === 'number' && Array.isArray(body.items)

/**
 * What an answer means: `ok`, `signedOut` (401, 419, a 403 from the panel's gate or two-factor, or a redirect that
 * ended on a page instead of the bell's JSON) or `failed`.
 */
export function verdict({ ok, status, redirected = false, body }) {
    if (ok && isBell(body)) {
        return 'ok'
    }

    return [401, 403, 419].includes(status) || (ok && redirected) ? 'signedOut' : 'failed'
}

/**
 * The tab title with the unread count in front: `{ base, full }`. `applied` is what the last call returned, so the
 * count it wrote is told apart from a page title that starts with a number in brackets.
 */
export function countedTitle(title, unread, applied = null) {
    const base = applied && title === applied.full ? applied.base : title

    return { base, full: unread > 0 ? `(${unread > 99 ? '99+' : unread}) ${base}` : base }
}

/** Which of `ids` nobody has claimed yet, and the claims with them added (a day old, or past 200, they are dropped). */
export function claimIds(claims, ids, now) {
    const live = Object.entries(claims ?? {}).filter(([, at]) => now - at < CLAIM_MS)
    const taken = new Set(live.map(([id]) => id))
    const won = ids.filter((id) => !taken.has(id))

    const kept = [...live, ...won.map((id) => [id, now])].sort(([, a], [, b]) => a - b).slice(-MAX_CLAIMS)

    return { won, claims: Object.fromEntries(kept) }
}

/** A body's text with its line breaks in one form (`whitespace-pre-line` draws them) and no blank ends. */
export function bodyText(body) {
    return (body ?? '').replace(/\r\n?/g, '\n').trim()
}
