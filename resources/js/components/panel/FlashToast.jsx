import { usePage } from '@inertiajs/react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'

const TONES = {
    success: { icon: CircleCheck, iconClass: 'text-green-400', barClass: 'bg-green-400', seconds: 4 },
    info: { icon: Info, iconClass: 'text-sky-400', barClass: 'bg-sky-400', seconds: 4 },
    warning: { icon: TriangleAlert, iconClass: 'text-amber-400', barClass: 'bg-amber-400', seconds: 6 },
    error: { icon: CircleAlert, iconClass: 'text-red-400', barClass: 'bg-red-400', seconds: 8 },
}

const SLIDE_MS = 250

function normalise(flash) {
    if (!flash) {
        return null
    }

    return typeof flash === 'string' ? { message: flash, tone: 'success' } : { message: flash.message, tone: TONES[flash.tone] ? flash.tone : 'success' }
}

export function FlashToast() {
    const { flash } = usePage().props
    const [toast, setToast] = useState(null)

    const patch = (id, changes) => setToast((current) => (current?.id === id ? { ...current, ...changes } : current))

    useEffect(() => {
        const next = normalise(flash?.message)

        if (next?.message) {
            setToast({ ...next, id: Date.now(), entered: false, leaving: false })
        }
    }, [flash])

    useEffect(() => {
        if (!toast?.id) {
            return undefined
        }

        const { id, tone } = toast
        const frame = requestAnimationFrame(() => requestAnimationFrame(() => patch(id, { entered: true })))
        const timer = setTimeout(() => patch(id, { leaving: true }), TONES[tone].seconds * 1000)

        return () => {
            cancelAnimationFrame(frame)
            clearTimeout(timer)
        }
    }, [toast?.id])

    useEffect(() => {
        if (!toast?.leaving) {
            return undefined
        }

        const timer = setTimeout(() => setToast((current) => (current?.leaving ? null : current)), SLIDE_MS)

        return () => clearTimeout(timer)
    }, [toast?.leaving])

    if (!toast) {
        return null
    }

    const tone = TONES[toast.tone]
    const Icon = tone.icon
    const visible = toast.entered && !toast.leaving

    return (
        <div
            key={toast.id}
            role="status"
            className={cn(
                'fixed right-3 bottom-3 z-50 flex max-w-sm items-start gap-2.5 overflow-hidden rounded-lg bg-zinc-900 py-2.5 pr-2 pl-3 text-xs text-zinc-50 shadow-xl ring-1 ring-black/10 transition duration-250 ease-out motion-reduce:transition-none',
                visible ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-[calc(100%+1rem)] opacity-0',
            )}
        >
            <Icon className={cn('mt-px size-4 shrink-0', tone.iconClass)} />
            <span className="flex-1 leading-5">{toast.message}</span>
            <button type="button" onClick={() => patch(toast.id, { leaving: true })} className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label={strings.close}>
                <X className="size-3.5" />
            </button>
            <span
                aria-hidden
                className={cn('absolute bottom-0 left-0 h-0.5 w-full origin-left transition-transform ease-linear motion-reduce:hidden', tone.barClass, toast.entered ? 'scale-x-0' : 'scale-x-100')}
                style={{ transitionDuration: `${tone.seconds * 1000}ms` }}
            />
        </div>
    )
}
