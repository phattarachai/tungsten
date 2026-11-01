import { router } from '@inertiajs/react'
import { Bell } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '../ui/Icon'
import { cn } from '../../lib/cn'
import { getJson, postJson } from '../../lib/json'
import { strings } from '../../lib/strings'
import { relative } from '../../lib/time'
import { TONE_DOT } from '../../lib/tones'

/** The user's notifications from `url`, refreshed every `poll` seconds while the tab is visible. */
function useNotifications(url, poll) {
    const [state, setState] = useState({ unread: 0, items: [] })

    const load = useCallback(() => getJson(url).then(setState).catch(() => {}), [url])

    useEffect(() => {
        load()

        const timer = setInterval(() => document.visibilityState === 'visible' && load(), poll * 1000)
        const onVisible = () => document.visibilityState === 'visible' && load()

        document.addEventListener('visibilitychange', onVisible)

        return () => {
            clearInterval(timer)
            document.removeEventListener('visibilitychange', onVisible)
        }
    }, [load, poll])

    const post = (path) => postJson(path).then(setState).catch(() => {})

    return { ...state, load, read: (id) => post(`${url}/${encodeURIComponent(id)}/read`), readAll: () => post(`${url}/read`) }
}

function Item({ item, onOpen }) {
    return (
        <button type="button" onClick={() => onOpen(item)} className={cn('flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-zinc-50', !item.read && 'bg-brand-50/40')}>
            <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                <Icon name={item.icon ?? 'bell'} className="size-3.5" />
                {item.tone && <span className={cn('absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2 ring-white', TONE_DOT[item.tone] ?? TONE_DOT.draft)} />}
            </span>
            <span className="min-w-0 flex-1">
                <span className={cn('block text-xs text-zinc-900', !item.read && 'font-semibold')}>{item.title}</span>
                {item.body && <span className="line-clamp-2 block text-[0.6875rem] text-zinc-500">{item.body}</span>}
                <span className="block text-[0.625rem] text-zinc-400">{relative(item.at)}</span>
            </span>
            {!item.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />}
        </button>
    )
}

/**
 * The topbar bell (`Panel::notifications()`): the unread count on the bell, the latest notifications in a menu; opening
 * one marks it read and follows its link; "อ่านทั้งหมดแล้ว" clears the count.
 */
export function NotificationBell({ url, poll = 30 }) {
    const { unread, items, load, read, readAll } = useNotifications(url, poll)
    const [open, setOpen] = useState(false)
    const root = useRef(null)

    useEffect(() => {
        if (!open) {
            return undefined
        }

        function close(event) {
            if (event.type === 'keydown' ? event.key === 'Escape' : !root.current?.contains(event.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', close)
        document.addEventListener('keydown', close)

        return () => {
            document.removeEventListener('mousedown', close)
            document.removeEventListener('keydown', close)
        }
    }, [open])

    function toggle() {
        if (!open) {
            load()
        }

        setOpen(!open)
    }

    function openItem(item) {
        setOpen(false)

        if (!item.read) {
            read(item.id)
        }

        if (item.url) {
            router.visit(item.url)
        }
    }

    return (
        <div ref={root} className="relative">
            <button type="button" onClick={toggle} aria-label={strings.notificationsCount(unread)} aria-expanded={open} className={cn('relative rounded p-1 text-zinc-500 hover:bg-topbar-hover hover:text-zinc-800', open && 'bg-topbar-hover text-zinc-900')}>
                <Bell className="size-4" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-600 px-0.5 text-[0.5625rem] leading-none font-semibold text-white tabular-nums">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 z-50 mt-1 w-96 max-w-[calc(100vw-2rem)] animate-panel-drop overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
                        <span className="text-xs font-semibold text-zinc-800">{strings.notifications}</span>
                        {unread > 0 && (
                            <button type="button" onClick={readAll} className="text-[0.6875rem] text-zinc-500 hover:text-brand">
                                {strings.markAllRead}
                            </button>
                        )}
                    </div>
                    <div className="max-h-[70vh] divide-y divide-zinc-100 overflow-y-auto">
                        {items.map((item) => (
                            <Item key={item.id} item={item} onOpen={openItem} />
                        ))}
                        {items.length === 0 && <p className="px-3 py-6 text-center text-xs text-zinc-400">{strings.noNotifications}</p>}
                    </div>
                </div>
            )}
        </div>
    )
}
