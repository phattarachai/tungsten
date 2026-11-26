import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { inBrowser } from '../../lib/browser'
import { cn } from '../../lib/cn'
import { bodyText, dismissToast, expireToasts, extendToasts, removeLeft, TOAST_SECONDS } from '../../lib/notices'
import { strings } from '../../lib/strings'
import { Icon } from '../ui/Icon'

// On the toast's dark ground the status inks are too dark, so each tone takes FlashToast's colour nearest to it.
const TONES = {
    done: { icon: 'text-green-400', bar: 'bg-green-400' },
    active: { icon: 'text-sky-400', bar: 'bg-sky-400' },
    todo: { icon: 'text-amber-400', bar: 'bg-amber-400' },
    waiting: { icon: 'text-amber-400', bar: 'bg-amber-400' },
    failed: { icon: 'text-red-400', bar: 'bg-red-400' },
    canceled: { icon: 'text-red-400', bar: 'bg-red-400' },
}
const PLAIN = { icon: 'text-zinc-300', bar: 'bg-zinc-400' }

const SLIDE_MS = 250

function useHidden() {
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        const update = () => setHidden(document.visibilityState !== 'visible')

        update()
        document.addEventListener('visibilitychange', update)

        return () => document.removeEventListener('visibilitychange', update)
    }, [])

    return hidden
}

function Toast({ toast, paused, onOpen, onDismiss }) {
    const { item, leaving } = toast
    const [entered, setEntered] = useState(() => Date.now() - toast.born > 1000)
    const tone = TONES[item.tone] ?? PLAIN
    const body = bodyText(item.body)
    const counting = entered && !paused && !leaving

    useEffect(() => {
        const frame = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))

        return () => cancelAnimationFrame(frame)
    }, [])

    return (
        <div
            role="status"
            className={cn(
                'relative w-full overflow-hidden rounded-lg bg-zinc-900 text-xs text-zinc-50 shadow-xl ring-1 ring-black/10 transition duration-250 ease-out motion-reduce:transition-none',
                entered && !leaving ? 'pointer-events-auto translate-x-0 opacity-100' : 'translate-x-[calc(100%+1rem)] opacity-0',
            )}
        >
            <div className="flex items-start gap-2.5 py-2.5 pr-2 pl-3">
                <button type="button" onClick={() => onOpen(item)} className="group flex min-w-0 flex-1 items-start gap-2.5 rounded text-left">
                    <Icon name={item.icon ?? 'bell'} className={cn('mt-0.5 size-4', tone.icon)} />
                    <span className="min-w-0 flex-1">
                        <span className="block leading-5 font-semibold wrap-break-word group-hover:underline">{item.title}</span>
                        {body && <span className="line-clamp-6 leading-5 wrap-break-word whitespace-pre-line text-zinc-300">{body}</span>}
                    </span>
                </button>
                <button type="button" onClick={() => onDismiss(item.id)} className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label={strings.close}>
                    <X className="size-3.5" />
                </button>
            </div>
            <span
                aria-hidden
                className={cn('absolute bottom-0 left-0 h-0.5 w-full origin-left transition-transform ease-linear motion-reduce:hidden', tone.bar, counting ? 'scale-x-0' : 'scale-x-100')}
                style={{ transitionDuration: counting ? `${TOAST_SECONDS * 1000}ms` : '0ms' }}
            />
        </div>
    )
}

/**
 * The live bell's toasts, bottom right over every overlay like FlashToast and standing on top of it (`--flash-toast`,
 * its height, set while it shows). `stack` is `{ shown, more }` (lib/notices.js), newest first; they wait while the
 * pointer or the focus is on them and while the tab is behind.
 */
export function NoticeToasts({ stack, onChange, onOpen, onMore }) {
    const [held, setHeld] = useState(false)
    const hidden = useHidden()
    const paused = held || hidden
    const wasPaused = useRef(false)
    const { shown, more } = stack
    const leaving = shown.some((toast) => toast.leaving)
    const next = Math.min(...shown.filter((toast) => !toast.leaving).map((toast) => toast.until))

    useEffect(() => {
        if (wasPaused.current && !paused) {
            onChange((current) => extendToasts(current, Date.now()))
        }

        wasPaused.current = paused
    }, [paused, onChange])

    useEffect(() => {
        if (paused || next === Infinity) {
            return undefined
        }

        const timer = setTimeout(() => onChange((current) => expireToasts(current, Date.now())), Math.max(0, next - Date.now()))

        return () => clearTimeout(timer)
    }, [paused, next, onChange])

    useEffect(() => {
        if (!leaving) {
            return undefined
        }

        const timer = setTimeout(() => onChange(removeLeft), SLIDE_MS)

        return () => clearTimeout(timer)
    }, [leaving, onChange])

    // The last toast takes the pointer's "leave" with it.
    useEffect(() => {
        if (shown.length === 0) {
            setHeld(false)
        }
    }, [shown.length])

    if (!inBrowser || shown.length === 0) {
        return null
    }

    return createPortal(
        <div
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={() => setHeld(false)}
            className="pointer-events-none fixed right-3 bottom-[calc(0.75rem+var(--flash-toast,0px))] z-[70] flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-2 transition-[bottom] duration-250 ease-out motion-reduce:transition-none"
        >
            {shown.map((toast) => (
                <Toast key={toast.item.id} toast={toast} paused={paused} onOpen={onOpen} onDismiss={(id) => onChange((current) => dismissToast(current, id))} />
            ))}
            {more > 0 && (
                <div role="status" className="pointer-events-auto self-end rounded-lg bg-zinc-900 text-xs text-zinc-300 shadow-xl ring-1 ring-black/10">
                    <button type="button" onClick={onMore} className="rounded-lg px-3 py-1.5 hover:text-white">
                        {strings.moreNotifications(more)}
                    </button>
                </div>
            )}
        </div>,
        document.body,
    )
}
