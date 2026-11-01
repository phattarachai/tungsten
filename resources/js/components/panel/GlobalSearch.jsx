import { router } from '@inertiajs/react'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { getJson } from '../../lib/json'
import { strings } from '../../lib/strings'

const DEBOUNCE_MS = 250
const MIN_LENGTH = 2

/** The flat list of results, so ↑ / ↓ move across groups. */
function flatten(groups) {
    return groups.flatMap((group) => group.results.map((result) => ({ ...result, group: group.label })))
}

function useSearch(url, term) {
    const [state, setState] = useState({ groups: [], loading: false, error: false })
    const latest = useRef(0)

    useEffect(() => {
        const query = term.trim()

        if (query.length < MIN_LENGTH) {
            setState({ groups: [], loading: false, error: false })

            return undefined
        }

        const id = ++latest.current
        setState((current) => ({ ...current, loading: true }))

        const timer = setTimeout(() => {
            getJson(url, { q: query })
                .then((body) => id === latest.current && setState({ groups: body.groups ?? [], loading: false, error: false }))
                .catch(() => id === latest.current && setState({ groups: [], loading: false, error: true }))
        }, DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [url, term])

    return state
}

function Result({ result, active, onPick, onHover }) {
    return (
        <a
            href={result.url}
            role="option"
            aria-selected={active}
            onMouseEnter={onHover}
            onClick={(event) => {
                event.preventDefault()
                onPick(result)
            }}
            className={cn('flex items-center gap-2 px-3 py-1.5 text-xs', active ? 'bg-zinc-100' : 'hover:bg-zinc-50')}
        >
            {result.image && <img src={result.image} alt="" className="size-6 shrink-0 rounded object-cover" />}
            <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-zinc-900">{result.title}</span>
                {result.details.length > 0 && (
                    <span className="block truncate text-[0.6875rem] text-zinc-500">
                        {result.details.map((detail) => `${detail.label} ${detail.value}`).join(' · ')}
                    </span>
                )}
            </span>
        </a>
    )
}

/**
 * The topbar's search across the panel's records (`Panel::globalSearch()` / a set's `searches()`): type two letters,
 * results come grouped by kind; ↑ / ↓ and Enter pick one, Escape closes, ⌘K / Ctrl+K jumps here from anywhere.
 */
export function GlobalSearch({ url, className }) {
    const [term, setTerm] = useState('')
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)
    const input = useRef(null)
    const root = useRef(null)
    const { groups, loading, error } = useSearch(url, term)
    const results = flatten(groups)
    const ready = term.trim().length >= MIN_LENGTH

    useEffect(() => setActive(0), [groups])

    useEffect(() => {
        function shortcut(event) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault()
                input.current?.focus()
                input.current?.select()
            }
        }

        function outside(event) {
            if (!root.current?.contains(event.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('keydown', shortcut)
        document.addEventListener('mousedown', outside)

        return () => {
            document.removeEventListener('keydown', shortcut)
            document.removeEventListener('mousedown', outside)
        }
    }, [])

    function pick(result) {
        setOpen(false)
        setTerm('')
        input.current?.blur()
        router.visit(result.url)
    }

    function onKeyDown(event) {
        const moves = { ArrowDown: 1, ArrowUp: -1 }

        if (moves[event.key] && results.length > 0) {
            event.preventDefault()
            setOpen(true)
            setActive((index) => (index + moves[event.key] + results.length) % results.length)
        }

        if (event.key === 'Enter' && results[active]) {
            event.preventDefault()
            pick(results[active])
        }

        if (event.key === 'Escape') {
            setOpen(false)
            input.current?.blur()
        }
    }

    let index = -1

    return (
        <div ref={root} className={cn('relative', className)}>
            <label className="relative flex items-center">
                <Search className="pointer-events-none absolute left-2 size-3.5 text-zinc-400" />
                <input
                    ref={input}
                    type="search"
                    value={term}
                    onChange={(event) => {
                        setTerm(event.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder={strings.globalSearch}
                    aria-label={strings.globalSearch}
                    role="combobox"
                    aria-expanded={open && ready}
                    className="h-7 w-44 rounded-md border border-zinc-300 bg-white pr-9 pl-7 text-xs text-zinc-800 placeholder:text-zinc-400 focus:w-72 focus:border-zinc-400 focus:outline-none md:w-56"
                />
                <kbd className="pointer-events-none absolute right-2 hidden rounded border border-zinc-200 px-1 text-[0.625rem] text-zinc-400 md:block">⌘K</kbd>
            </label>
            {open && ready && (
                <div role="listbox" className="absolute right-0 z-50 mt-1 max-h-[70vh] w-96 max-w-[calc(100vw-2rem)] animate-panel-drop overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <div className="px-3 pt-1.5 pb-0.5 text-[0.625rem] font-semibold tracking-wide text-zinc-400">{group.label}</div>
                            {group.results.map((result) => {
                                index += 1
                                const at = index

                                return <Result key={`${group.label}-${result.url}`} result={result} active={at === active} onPick={pick} onHover={() => setActive(at)} />
                            })}
                        </div>
                    ))}
                    {results.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">{loading ? strings.searching : error ? strings.requestFailed : strings.noResults}</p>}
                </div>
            )}
        </div>
    )
}
