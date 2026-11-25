import { Link } from '@inertiajs/react'
import { Bell, BellOff } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

import { Icon } from '../ui/Icon'
import { Switch } from '../ui/Switch'
import { cn } from '../../lib/cn'
import { bodyText, NO_TOASTS } from '../../lib/notices'
import { noticeStore, serverSnapshot } from '../../lib/noticeStore'
import { strings } from '../../lib/strings'
import { relative } from '../../lib/time'
import { TONE_DOT } from '../../lib/tones'
import { NoticeToasts } from './NoticeToasts'

/** The user's notifications from `url`, refreshed every `poll` seconds while the tab is visible. */
function useNotifications(url, { poll, live, user }) {
    const store = useMemo(() => noticeStore(url, user), [url, user])
    const state = useSyncExternalStore(store.subscribe, store.snapshot, serverSnapshot)

    useEffect(() => store.attach({ poll, live, keep: live && user !== undefined }), [store, poll, live, user])

    return [state, store]
}

function Item({ item, onOpen }) {
    const body = bodyText(item.body)

    return (
        <button type="button" onClick={() => onOpen(item)} className={cn('flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-zinc-50', !item.read && 'bg-brand-50/40')}>
            <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                <Icon name={item.icon ?? 'bell'} className="size-3.5" />
                {item.tone && <span className={cn('absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2 ring-white', TONE_DOT[item.tone] ?? TONE_DOT.draft)} />}
            </span>
            <span className="min-w-0 flex-1">
                <span className={cn('block text-xs text-zinc-900', !item.read && 'font-semibold')}>{item.title}</span>
                {body && <span className={cn('text-[0.6875rem] whitespace-pre-line text-zinc-500', body.includes('\n') ? 'line-clamp-6' : 'line-clamp-2')}>{body}</span>}
                <span className="block text-[0.625rem] text-zinc-400">{relative(item.at)}</span>
            </span>
            {!item.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />}
        </button>
    )
}

function SignedOut() {
    function reload(event) {
        event.preventDefault()
        window.location.reload()
    }

    return (
        <p className="px-3 py-6 text-center text-xs text-zinc-500">
            {strings.signedOut}{' '}
            <a href={window.location.href} onClick={reload} className="font-medium text-brand hover:underline">
                {strings.signInAgain}
            </a>
        </p>
    )
}

function Preference({ label, note, ...control }) {
    return (
        <span className="flex items-center gap-1.5">
            <span>{label}</span>
            {note && <span className="text-zinc-400">{note}</span>}
            <Switch label={label} {...control} />
        </span>
    )
}

/** The menu's foot: the link to every notice, and with `live` the desktop and sound switches. */
function Footer({ all, live, desktop, sound, store, onLeave }) {
    if (!all && !live) {
        return null
    }

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-100 px-3 py-2 text-[0.6875rem] text-zinc-500">
            {all && (
                <Link href={all} onClick={onLeave} className="font-medium text-zinc-700 hover:text-brand">
                    {strings.allNotifications}
                </Link>
            )}
            {live && (
                <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {desktop !== 'unsupported' && (
                        <Preference
                            label={strings.desktopNotifications}
                            note={desktop === 'blocked' ? strings.desktopBlocked : null}
                            checked={desktop === 'on'}
                            disabled={desktop === 'blocked'}
                            onChange={store.setDesktop}
                        />
                    )}
                    <Preference label={strings.notificationSound} checked={sound} onChange={store.setSound} />
                </span>
            )}
        </div>
    )
}

/**
 * The topbar bell (`Panel::notifications()`): the unread count on the bell, the latest notifications in a menu; opening
 * one marks it read and follows its link; "อ่านทั้งหมดแล้ว" clears the count. `all` is the link to every notice.
 *
 * `live` announces what arrives while the page is open: a toast, the count in the tab title, and where the user turned
 * them on in the menu, a desktop notification while the tab is behind and a beep. `user` (the signed-in user's id)
 * keeps what was already announced across page visits, for that user only.
 */
export function NotificationBell({ url, poll = 30, live = false, all = null, user }) {
    const [{ unread, items, signedOut, toasts, desktop, sound }, store] = useNotifications(url, { poll, live, user })
    const [open, setOpen] = useState(false)
    const root = useRef(null)
    const button = useRef(null)

    useEffect(() => {
        if (!open) {
            return undefined
        }

        function close(event) {
            if (event.type === 'keydown' ? event.key !== 'Escape' : root.current?.contains(event.target)) {
                return
            }

            if (event.type === 'keydown' && root.current?.contains(document.activeElement)) {
                button.current?.focus()
            }

            setOpen(false)
        }

        document.addEventListener('mousedown', close)
        document.addEventListener('keydown', close)

        return () => {
            document.removeEventListener('mousedown', close)
            document.removeEventListener('keydown', close)
        }
    }, [open])

    // The list now shows what the toasts said.
    function show() {
        store.load()
        store.setToasts(() => NO_TOASTS)
        setOpen(true)
    }

    function openItem(item) {
        setOpen(false)
        store.open(item)
    }

    const Mark = signedOut ? BellOff : Bell

    return (
        <div ref={root} className="relative">
            <button
                ref={button}
                type="button"
                onClick={open ? () => setOpen(false) : show}
                aria-label={signedOut ? strings.signedOut : strings.notificationsCount(unread)}
                aria-expanded={open}
                className={cn('relative rounded p-1 text-zinc-500 hover:bg-topbar-hover hover:text-zinc-800', open && 'bg-topbar-hover text-zinc-900')}
            >
                <Mark className="size-4" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-600 px-0.5 text-[0.5625rem] leading-none font-semibold text-white tabular-nums">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 z-50 mt-1 w-96 animate-panel-drop overflow-hidden max-sm:fixed max-sm:inset-x-2 max-sm:w-auto rounded-md border border-zinc-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
                        <span className="text-xs font-semibold text-zinc-800">{strings.notifications}</span>
                        {unread > 0 && (
                            <button type="button" onClick={store.readAll} className="text-[0.6875rem] text-zinc-500 hover:text-brand">
                                {strings.markAllRead}
                            </button>
                        )}
                    </div>
                    {signedOut ? (
                        <SignedOut />
                    ) : (
                        <div className="max-h-[70vh] divide-y divide-zinc-100 overflow-y-auto">
                            {items.map((item) => (
                                <Item key={item.id} item={item} onOpen={openItem} />
                            ))}
                            {items.length === 0 && <p className="px-3 py-6 text-center text-xs text-zinc-400">{strings.noNotifications}</p>}
                        </div>
                    )}
                    {!signedOut && <Footer all={all} live={live} desktop={desktop} sound={sound} store={store} onLeave={() => setOpen(false)} />}
                </div>
            )}
            {live && <NoticeToasts stack={toasts} onChange={store.setToasts} onOpen={store.open} onMore={show} />}
        </div>
    )
}
