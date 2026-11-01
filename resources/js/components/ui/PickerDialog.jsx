import { useEffect, useRef, useState } from 'react'

import { Button } from './Button'
import { Dialog } from './Dialog'
import { Input } from './form'
import { cn } from '../../lib/cn'
import { getJson } from '../../lib/json'
import { strings } from '../../lib/strings'

const DEBOUNCE_MS = 250

function matches(option, term) {
    const needle = term.trim().toLowerCase()

    return needle === '' || [option.title, option.subtitle, option.variant, option.label].some((text) => String(text ?? '').toLowerCase().includes(needle))
}

/** Options from `url` (`getJson(url, { [queryKey]: term })`, a list or `{ data }`), refetched as the term changes. */
function useRemoteOptions(url, queryKey, term, enabled) {
    const [state, setState] = useState({ options: [], loading: false })
    const latest = useRef(0)

    useEffect(() => {
        if (!url || !enabled) {
            return undefined
        }

        const id = ++latest.current
        setState((current) => ({ ...current, loading: true }))

        const timer = setTimeout(() => {
            getJson(url, { [queryKey]: term.trim() })
                .then((body) => id === latest.current && setState({ options: Array.isArray(body) ? body : (body.data ?? body.options ?? []), loading: false }))
                .catch(() => id === latest.current && setState({ options: [], loading: false }))
        }, term === '' ? 0 : DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [url, queryKey, term, enabled])

    return state
}

function Card({ option, count, onPick }) {
    const image = option.image ?? option.thumb
    const subtitle = option.subtitle ?? option.variant
    const meta = option.meta ?? option.price

    return (
        <button
            type="button"
            disabled={option.disabled}
            onClick={() => onPick(option)}
            className="relative flex flex-col gap-1.5 rounded-lg border border-zinc-200 p-2 text-left hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-200 disabled:hover:bg-transparent"
        >
            {count > 0 && <span className="absolute top-3 right-3 rounded-full bg-zinc-900 px-1.5 text-[0.6875rem] text-white tabular-nums">×{count}</span>}
            {image ? <img src={image} alt="" loading="lazy" className="aspect-square w-full rounded-md bg-zinc-100 object-cover" /> : <span className="aspect-square w-full rounded-md bg-zinc-100" />}
            <span className="line-clamp-2 text-[0.75rem] leading-snug font-medium text-zinc-900">{option.title ?? option.label}</span>
            {subtitle && <span className="truncate text-[0.6875rem] text-zinc-500">{subtitle}</span>}
            {meta && <span className="mt-auto text-[0.75rem] font-semibold tabular-nums">{meta}</span>}
        </button>
    )
}

/**
 * A picture-card picker (products, rewards, campaign items): a search on top, the choices as cards; a click adds one
 * and the dialog stays open for the next, a card already picked showing ×qty from `counts`. Options are
 * `{ value, title, subtitle?, image?, meta?, disabled? }`, from `options` (filtered as you type) or from `url`
 * (fetched as you type, the term as `queryKey`). `error` shows a line above the cards (a refused pick).
 */
export function PickerDialog({ open = true, title, placeholder = strings.search, options, url, queryKey = 'search', counts = {}, onPick, onClose, error, doneLabel = strings.pickerDone, className }) {
    const [term, setTerm] = useState('')
    const remote = useRemoteOptions(url, queryKey, term, open)
    const shown = url ? remote.options : (options ?? []).filter((option) => matches(option, term))

    useEffect(() => {
        if (!open) {
            setTerm('')
        }
    }, [open])

    return (
        <Dialog open={open} onClose={onClose} title={title} className={cn('max-w-3xl', className)} footer={<Button size="sm" onClick={onClose}>{doneLabel}</Button>}>
            <div className="space-y-3">
                <Input type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
                {error && (
                    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-[0.75rem] whitespace-pre-line text-red-700">
                        {error}
                    </p>
                )}
                {shown.length === 0 ? (
                    <p className="py-8 text-center text-zinc-400">{remote.loading ? strings.searching : strings.pickerEmpty}</p>
                ) : (
                    <div className={cn('grid max-h-[60vh] grid-cols-2 gap-2.5 overflow-y-auto sm:grid-cols-4', remote.loading && 'opacity-60')}>
                        {shown.map((option) => (
                            <Card key={option.value} option={option} count={counts[option.value] ?? 0} onPick={onPick} />
                        ))}
                    </div>
                )}
            </div>
        </Dialog>
    )
}
