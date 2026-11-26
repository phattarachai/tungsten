import { router } from '@inertiajs/react'

import { beep, soundReady, unlockSound } from './beep'
import { inBrowser, readStorage, writeStorage } from './browser'
import { sendJson } from './json'
import { bodyText, claimIds, countedTitle, intake, MAX_TOASTS, NO_TOASTS, pollDelay, pushToasts, dismissToast, expireToasts, removeLeft, syncToasts, verdict } from './notices'
import { strings } from './strings'

const DESKTOP_KEY = 'panel-bell-desktop'
const SOUND_KEY = 'panel-bell-sound'
const CLAIMS_KEY = 'panel-bell-claims'
const HUNG_MS = 30000

const EMPTY = Object.freeze({ unread: 0, items: [], signedOut: false, toasts: NO_TOASTS, desktop: 'unsupported', sound: false })

const isHidden = () => document.visibilityState !== 'visible'

/** `unsupported`, `blocked` (the browser refuses), `on` or `off`. */
function desktopState() {
    const permission = window.Notification?.permission

    if (!permission) {
        return 'unsupported'
    }

    if (permission === 'denied') {
        return 'blocked'
    }

    return permission === 'granted' && readStorage(DESKTOP_KEY) === 'true' ? 'on' : 'off'
}

/** The ids of `ids` that no other tab of this browser has taken yet. */
function claim(ids) {
    let claims = {}

    try {
        claims = JSON.parse(readStorage(CLAIMS_KEY) ?? '{}')
    } catch {
        // written by something else: start over
    }

    const result = claimIds(claims, ids, Date.now())

    writeStorage(CLAIMS_KEY, JSON.stringify(result.claims))

    return result.won
}

/**
 * One bell's state and its polling, kept outside React: a layout that remounts on a page visit finds the same store,
 * so an item is announced once per page load. Runs while something is attached.
 */
function createStore(url) {
    const listeners = new Set()
    const desktopNotices = new Map()
    let state = EMPTY
    let options = { poll: 30, live: false, keep: false }
    let attached = 0
    let tracker = null
    let timer = null
    let failures = 0
    let started = 0
    let applied = 0
    let latest = null
    let title = null
    let stopListening = () => {}

    function set(changes) {
        state = { ...state, ...changes }
        listeners.forEach((listener) => listener())
    }

    const setToasts = (change) => set({ toasts: change(state.toasts) })

    function paintTitle() {
        if (!options.live) {
            return
        }

        title = countedTitle(document.title, attached > 0 ? state.unread : 0, title)

        if (document.title !== title.full) {
            document.title = title.full
        }
    }

    function schedule() {
        clearTimeout(timer)
        timer = null

        if (attached === 0 || state.signedOut) {
            return
        }

        const seconds = pollDelay({ poll: options.poll, failures, hidden: isHidden(), background: options.live && state.desktop === 'on' })

        if (seconds !== null) {
            timer = setTimeout(tick, seconds * 1000)
        }
    }

    function tick() {
        schedule()

        if (latest === null || Date.now() - latest.at > HUNG_MS) {
            load()
        }
    }

    function showDesktop(tag, heading, body, onClick) {
        const notice = new window.Notification(heading, { body, tag })

        desktopNotices.set(tag, notice)
        notice.onclose = () => desktopNotices.delete(tag)
        notice.onclick = () => {
            window.focus()
            notice.close()
            onClick()
        }
    }

    /** Tells the system about what arrived behind another tab. The tag keeps two tabs racing the claim to one notice. */
    function announceDesktop(fresh) {
        try {
            fresh.slice(0, MAX_TOASTS).reverse().forEach((item) => showDesktop(`panel-bell-${item.id}`, item.title, bodyText(item.body), () => open(item)))

            if (fresh.length > MAX_TOASTS) {
                showDesktop('panel-bell-more', strings.notifications, strings.moreNotifications(fresh.length - MAX_TOASTS), () => {})
            }
        } catch {
            // Chrome on Android has the API but only lets a service worker use it
            writeStorage(DESKTOP_KEY, 'false')
            refreshPreferences()
        }
    }

    function announce(fresh, total) {
        setToasts((stack) => pushToasts(stack, fresh, Date.now(), total))

        const unclaimed = new Set(claim(fresh.map((item) => item.id)))

        if (isHidden() && state.desktop === 'on') {
            announceDesktop(fresh.filter((item) => unclaimed.has(item.id)))
        }

        if (state.sound && soundReady() && claim([`sound-${fresh[0].id}`]).length > 0) {
            beep()
        }
    }

    function accept({ unread, items }) {
        const before = state.unread
        const taken = intake(tracker, items)
        const total = taken.fresh.length === items.length ? Math.max(taken.fresh.length, unread - before) : taken.fresh.length

        tracker = taken.tracker
        items.filter((item) => item.read).forEach((item) => desktopNotices.get(`panel-bell-${item.id}`)?.close())
        set({ unread, items, signedOut: false, toasts: syncToasts(state.toasts, items) })

        if (options.live && taken.fresh.length > 0) {
            announce(taken.fresh, total)
        }

        paintTitle()
    }

    function settle(result, number) {
        // A newer answer has been applied, or the bell has left the page: this one is out of date.
        if (attached === 0 || number < applied) {
            return 'stale'
        }

        const meaning = verdict(result)

        if (meaning === 'ok') {
            applied = number
            accept(result.body)
        }

        if (meaning === 'signedOut') {
            applied = number
            clearTimeout(timer)
            set({ signedOut: true, unread: 0, items: [], toasts: NO_TOASTS })
            paintTitle()
        }

        return meaning
    }

    async function load() {
        started += 1

        const request = { number: started, at: Date.now() }
        const wasSignedOut = state.signedOut

        latest = request

        const meaning = settle(await sendJson(url).catch(() => ({ ok: false, status: 0, body: {} })), request.number)

        if (latest === request) {
            latest = null
        }

        if (meaning === 'ok' && (failures > 0 || wasSignedOut)) {
            failures = 0
            schedule()
        }

        if (meaning === 'failed' && !state.signedOut) {
            failures += 1
            schedule()
        }
    }

    async function post(path) {
        const result = await sendJson(path, 'POST', {}).catch(() => null)

        if (result) {
            // Numbered when it lands: a poll that left before the write must not undo it.
            started += 1
            settle(result, started)
        }
    }

    const read = (id) => post(`${url}/${encodeURIComponent(id)}/read`)

    function open(item) {
        setToasts((stack) => dismissToast(stack, item.id))

        if (!item.read) {
            read(item.id)
        }

        if (item.url) {
            router.visit(item.url)
        }
    }

    function refreshPreferences() {
        const desktop = desktopState()
        const sound = readStorage(SOUND_KEY) === 'true'

        if (desktop !== state.desktop || sound !== state.sound) {
            set({ desktop, sound })
        }
    }

    function listen() {
        const onVisible = () => {
            if (options.live) {
                refreshPreferences()
            }

            if (!isHidden() && !state.signedOut) {
                load()
            }

            schedule()
        }

        // The app still answers, so the sign-in is back (done in another tab): ask again.
        const offSuccess = router.on('success', () => state.signedOut && load())

        document.addEventListener('visibilitychange', onVisible)

        const off = () => {
            document.removeEventListener('visibilitychange', onVisible)
            offSuccess()
        }

        if (!options.live) {
            return off
        }

        const onStorage = (event) => {
            if (event.key === DESKTOP_KEY || event.key === SOUND_KEY) {
                refreshPreferences()
                schedule()
            }
        }
        const onGesture = () => state.sound && !soundReady() && unlockSound()
        const observer = new window.MutationObserver(paintTitle)

        window.addEventListener('storage', onStorage)
        document.addEventListener('pointerdown', onGesture)
        document.addEventListener('keydown', onGesture)
        observer.observe(document.head, { childList: true, subtree: true, characterData: true })

        return () => {
            off()
            window.removeEventListener('storage', onStorage)
            document.removeEventListener('pointerdown', onGesture)
            document.removeEventListener('keydown', onGesture)
            observer.disconnect()
        }
    }

    function attach(next) {
        attached += 1
        stopListening()
        options = next

        if (next.live) {
            refreshPreferences()
            setToasts((stack) => removeLeft(isHidden() ? stack : expireToasts(stack, Date.now())))
        }

        stopListening = listen()
        paintTitle()
        load()
        schedule()

        return detach
    }

    function detach() {
        attached -= 1

        if (attached > 0) {
            return
        }

        clearTimeout(timer)
        stopListening()
        stopListening = () => {}
        paintTitle()
        failures = 0
        latest = null

        if (!options.keep) {
            started += 1
            applied = started
            state = EMPTY
            tracker = null
            title = null
        }
    }

    return {
        attach,
        refresh: refreshPreferences,
        load: () => (state.signedOut ? undefined : load()),
        open,
        read,
        readAll: () => post(`${url}/read`),
        setToasts,
        snapshot: () => state,
        subscribe: (listener) => {
            listeners.add(listener)

            return () => listeners.delete(listener)
        },
        /** From a click: the browser asks for permission only then. */
        async setDesktop(on) {
            if (on && window.Notification?.permission === 'default') {
                await window.Notification.requestPermission()
            }

            writeStorage(DESKTOP_KEY, JSON.stringify(on && window.Notification?.permission === 'granted'))
            refreshPreferences()
            schedule()
        },
        /** From a click, which is what lets the browser play sound; turning it on plays it once. */
        async setSound(on) {
            writeStorage(SOUND_KEY, JSON.stringify(on))
            refreshPreferences()

            if (on) {
                await unlockSound()
                beep()
            }
        },
    }
}

const IDLE = { attach: () => () => {}, snapshot: () => EMPTY, subscribe: () => () => {} }

const stores = new Map()

/** The store for a bell's `url`, one per signed-in `user`: the next user's bell never starts from the last one's. */
export function noticeStore(url, user = null) {
    if (!inBrowser) {
        return IDLE
    }

    const held = stores.get(url)

    if (held && held.user === user) {
        return held.store
    }

    const store = createStore(url)

    stores.set(url, { user, store })

    return store
}

export const serverSnapshot = () => EMPTY
