import { router } from '@inertiajs/react'
import { ArrowUpRight, History, Pin, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Icon } from '../ui/Icon'
import { cn } from '../../lib/cn'
import { getJson } from '../../lib/json'
import { readList, remember, sameUrl, snapshot, writeList } from '../../lib/launchpadStore'
import { strings } from '../../lib/strings'

const DEBOUNCE_MS = 200
const RECORD_MIN = 2
const SHOWN_LIMIT = 5
const MENU_LIMIT = 8
const NO_GROUPS = []

function lower(text) {
    return (text ?? '').toLocaleLowerCase()
}

/** The panel's nav entries (the shared `nav` prop, already filtered by ability) that match `term`, best first. */
export function matchMenus(nav, term) {
    const needle = lower(term)
    const rank = (entry) => (lower(entry.title).startsWith(needle) ? 0 : lower(entry.title).includes(needle) ? 1 : 2)

    return (nav ?? [])
        .flatMap((section) => section.items.filter((item) => !item.legacy).map((item) => ({ kind: 'menu', title: item.label, subtitle: section.group, icon: item.icon, url: item.url, external: item.external })))
        .filter((entry) => lower(entry.title).includes(needle) || lower(entry.subtitle).includes(needle))
        .sort((a, b) => rank(a) - rank(b))
        .slice(0, MENU_LIMIT)
}

function recordEntries(group) {
    return group.results.map((result) => ({
        kind: 'record',
        title: result.title,
        subtitle: (result.details ?? []).map((detail) => `${detail.label} ${detail.value}`).join(' · ') || null,
        url: result.url,
        image: result.image,
        icon: group.icon,
    }))
}

/** The record kinds (`GlobalSearch` providers) from two letters, debounced; the last answer stays while the next loads. */
function useRecordSearch(url, term) {
    const [result, setResult] = useState({ term: '', groups: NO_GROUPS, error: false })
    const latest = useRef(0)
    const active = Boolean(url) && term.length >= RECORD_MIN

    useEffect(() => {
        if (!active) {
            return undefined
        }

        const id = ++latest.current
        const timer = setTimeout(() => {
            getJson(url, { q: term })
                .then((body) => id === latest.current && setResult({ term, groups: body.groups ?? NO_GROUPS, error: false }))
                .catch(() => id === latest.current && setResult({ term, groups: NO_GROUPS, error: true }))
        }, DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [url, term, active])

    if (!active) {
        return { groups: NO_GROUPS, pending: false, error: false }
    }

    return { groups: result.groups, pending: result.term !== term, error: result.term === term && result.error }
}

function Highlight({ text, term }) {
    const at = term ? lower(text).indexOf(lower(term)) : -1

    if (at < 0) {
        return text
    }

    return (
        <>
            {text.slice(0, at)}
            <mark className="bg-transparent font-semibold text-zinc-900 underline decoration-brand/60 decoration-2 underline-offset-2">{text.slice(at, at + term.length)}</mark>
            {text.slice(at + term.length)}
        </>
    )
}

function Kbd({ children }) {
    return <kbd className="rounded border border-zinc-200 bg-white px-1 font-sans text-[0.625rem] leading-4 text-zinc-500">{children}</kbd>
}

function plainClick(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function Row({ entry, selected, term, pinned, onPin, onOpen, onHover }) {
    const ref = useRef(null)

    useEffect(() => {
        if (selected) {
            ref.current?.scrollIntoView?.({ block: 'nearest' })
        }
    }, [selected])

    return (
        <div ref={ref} className="group relative" onMouseMove={onHover}>
            <a
                href={entry.url}
                role="option"
                aria-selected={selected}
                onClick={(event) => {
                    if (plainClick(event)) {
                        event.preventDefault()
                        onOpen(entry, false)
                    }
                }}
                className={cn('flex items-center gap-2.5 py-1.5 pr-11 pl-3.5', selected ? 'bg-brand-50 shadow-[inset_2px_0_0_var(--color-brand)]' : 'hover:bg-brand-50/50')}
            >
                {entry.image ? (
                    <img src={entry.image} alt="" className="size-6.5 shrink-0 rounded-md object-cover" />
                ) : (
                    <span className={cn('flex size-6.5 shrink-0 items-center justify-center rounded-md', selected ? 'bg-brand text-white' : 'bg-zinc-100 text-zinc-500 group-hover:text-brand')}>
                        <Icon name={entry.icon ?? (entry.kind === 'menu' ? 'layout-grid' : undefined)} className="size-3.5" />
                    </span>
                )}
                <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] text-zinc-900">
                        <Highlight text={entry.title} term={term} />
                    </span>
                    {entry.subtitle && (
                        <span className="block truncate text-zinc-500">
                            <Highlight text={entry.subtitle} term={term} />
                        </span>
                    )}
                </span>
                {entry.external && <ArrowUpRight className="ml-auto size-3 shrink-0 text-zinc-400" />}
            </a>
            <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onPin}
                aria-label={pinned ? strings.unpin : strings.pin}
                title={pinned ? strings.unpin : strings.pin}
                className={cn(
                    'absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded hover:bg-white hover:text-brand',
                    pinned ? 'text-brand' : 'text-zinc-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                    selected && 'opacity-100',
                )}
            >
                <Pin className={cn('size-3.5', pinned && 'fill-current')} />
            </button>
        </div>
    )
}

function Heading({ icon: Glyph, action, children }) {
    return (
        <div className="flex items-center gap-1.5 px-3.5 pt-2.5 pb-1 text-[0.6875rem] font-medium text-zinc-500">
            {Glyph && <Glyph className="size-3.5 text-zinc-400" />}
            {children}
            {action}
        </div>
    )
}

function numbered(sections) {
    let position = 0

    return sections.filter((section) => section.entries.length > 0).map((section) => ({ ...section, entries: section.entries.map((entry) => ({ ...entry, position: position++ })) }))
}

function without(list, ...others) {
    return list.filter((item) => !others.some((other) => other.some((entry) => sameUrl(entry.url, item.url))))
}

function Sheet({ url, nav, scope, placeholder, mac, onClose }) {
    const listId = useId()
    const [query, setQuery] = useState('')
    const [selection, setSelection] = useState({ sections: null, index: 0 })
    const [pinned, setPinned] = useState(() => readList(scope, 'pinned'))
    const [searched, setSearched] = useState(() => readList(scope, 'searched'))
    const [opened] = useState(() => readList(scope, 'opened'))
    const term = query.trim()
    const { groups, pending, error } = useRecordSearch(url, term)
    const isPinned = (entry) => pinned.some((item) => sameUrl(item.url, entry.url))

    const sections = useMemo(() => {
        if (term === '') {
            const recent = without(searched, pinned).slice(0, SHOWN_LIMIT)

            return numbered([
                { key: 'pinned', label: strings.pinned, icon: Pin, entries: pinned },
                { key: 'searched', label: strings.recentSearched, icon: Search, clearable: true, entries: recent },
                { key: 'opened', label: strings.recentOpened, icon: History, entries: without(opened, pinned, recent).slice(0, SHOWN_LIMIT) },
            ])
        }

        return numbered([
            { key: 'menu', label: strings.menu, entries: matchMenus(nav, term) },
            ...groups.map((group) => ({ key: `group-${group.label}`, label: group.label, entries: recordEntries(group) })),
        ])
    }, [term, nav, groups, pinned, searched, opened])

    const flat = sections.flatMap((section) => section.entries)
    const current = selection.sections === sections ? Math.min(selection.index, flat.length - 1) : 0

    function select(index) {
        setSelection({ sections, index })
    }

    function togglePin(entry) {
        const next = isPinned(entry) ? pinned.filter((item) => !sameUrl(item.url, entry.url)) : [snapshot(entry), ...pinned]

        writeList(scope, 'pinned', next)
        setPinned(readList(scope, 'pinned'))
    }

    function clearSearched() {
        writeList(scope, 'searched', [])
        setSearched([])
    }

    function open(entry, newTab) {
        if (!entry) {
            return
        }

        if (entry.kind === 'record') {
            remember(scope, 'searched', snapshot(entry))
        }

        onClose(false)

        if (newTab) {
            window.open(entry.url, '_blank', 'noopener')

            return
        }

        if (entry.external) {
            window.location.assign(entry.url)

            return
        }

        router.visit(entry.url)
    }

    function onKeyDown(event) {
        const step = { ArrowDown: 1, ArrowUp: -1 }[event.key]

        if (step) {
            event.preventDefault()
            select((flat.length + current + step) % Math.max(flat.length, 1))
        }

        if (event.key === 'Enter') {
            event.preventDefault()
            open(flat[current], event.metaKey || event.ctrlKey)
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            onClose(true)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex animate-panel-fade items-start justify-center bg-zinc-900/40 p-4 pt-[8vh]" onMouseDown={() => onClose(true)}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={strings.launchpad}
                className="flex max-h-[80vh] w-full max-w-2xl animate-panel-pop flex-col overflow-hidden rounded-[0.625rem] bg-white text-xs shadow-2xl ring-1 ring-zinc-900/5"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-zinc-100 px-3.5">
                    <Search className="size-4.5 text-brand" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder ?? strings.launchpadPlaceholder}
                        aria-label={strings.launchpad}
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={listId}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[0.9375rem] text-zinc-900 caret-brand placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
                    />
                    {pending && <span className="size-3 animate-spin rounded-full border-2 border-brand-50 border-t-brand" aria-hidden="true" />}
                    <Kbd>esc</Kbd>
                </div>
                <div id={listId} role="listbox" className="min-h-0 flex-1 overflow-y-auto pb-1.5">
                    {sections.map((section) => (
                        <div key={section.key} role="group" aria-label={section.label}>
                            <Heading
                                icon={section.icon}
                                action={
                                    section.clearable && (
                                        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={clearSearched} className="ml-auto font-normal text-zinc-400 hover:text-brand">
                                            {strings.clear}
                                        </button>
                                    )
                                }
                            >
                                {section.label}
                            </Heading>
                            {section.entries.map((entry) => (
                                <Row
                                    key={`${section.key}-${entry.url}`}
                                    entry={entry}
                                    term={term}
                                    selected={entry.position === current}
                                    pinned={isPinned(entry)}
                                    onPin={() => togglePin(entry)}
                                    onOpen={open}
                                    onHover={() => entry.position !== current && select(entry.position)}
                                />
                            ))}
                        </div>
                    ))}
                    {error && <p className="px-3.5 pt-2 text-zinc-400">{strings.requestFailed}</p>}
                    {term !== '' && flat.length === 0 && !pending && !error && <p className="px-3.5 py-6 text-center text-zinc-400">{strings.notFound(term)}</p>}
                    {term === '' && flat.length === 0 && <p className="px-3.5 py-6 text-center text-zinc-400">{strings.launchpadEmpty}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3.5 border-t border-zinc-100 bg-zinc-50 px-3.5 py-1.5 text-[0.6875rem] text-zinc-400">
                    <span className="flex items-center gap-1">
                        <Kbd>↑↓</Kbd>
                        {strings.keySelect}
                    </span>
                    <span className="flex items-center gap-1">
                        <Kbd>↵</Kbd>
                        {strings.keyOpen}
                    </span>
                    <span className="flex items-center gap-1">
                        <Kbd>{mac ? '⌘↵' : 'Ctrl ↵'}</Kbd>
                        {strings.keyNewTab}
                    </span>
                    <span className="flex items-center gap-1">
                        <Kbd>esc</Kbd>
                        {strings.close}
                    </span>
                </div>
            </div>
        </div>,
        document.body,
    )
}

/**
 * The topbar's search box, which opens a launchpad: a large input over the panel's menus (`nav`, from one letter)
 * and its records (`url`, the `GlobalSearch` providers, from two), with pinned and recent items (stored per `scope`,
 * the panel id) when the input is empty. ↑ / ↓ and Enter pick, ⌘ / Ctrl + Enter opens a new tab, Escape closes,
 * ⌘K / Ctrl+K opens it from anywhere. A page adds its record to "เปิดล่าสุด" with `useRememberRecord()`.
 */
export function Launchpad({ url, nav, scope, placeholder, className }) {
    const [open, setOpen] = useState(false)
    const [mac, setMac] = useState(true)
    const trigger = useRef(null)

    useEffect(() => {
        setMac(/Mac|iPhone|iPad/.test(window.navigator.platform ?? ''))

        function shortcut(event) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault()
                setOpen((previous) => !previous)
            }
        }

        window.addEventListener('keydown', shortcut)

        return () => window.removeEventListener('keydown', shortcut)
    }, [])

    function close(restoreFocus) {
        setOpen(false)

        if (restoreFocus) {
            trigger.current?.focus()
        }
    }

    return (
        <>
            <button
                ref={trigger}
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                className={cn(
                    'group flex h-7 w-44 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 focus-visible:border-brand focus-visible:outline-none md:w-56',
                    className,
                )}
            >
                <Search className="size-3.5 group-hover:text-brand" />
                {strings.globalSearch}
                <span className="ml-auto hidden md:block">
                    <Kbd>{mac ? '⌘K' : 'Ctrl K'}</Kbd>
                </span>
            </button>
            {open && <Sheet url={url} nav={nav} scope={scope} placeholder={placeholder} mac={mac} onClose={close} />}
        </>
    )
}
