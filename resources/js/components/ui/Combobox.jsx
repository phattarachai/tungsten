import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../lib/cn'
import { popoverMotion } from '../../lib/motion'
import { strings } from '../../lib/strings'

const TRIGGER_SIZES = {
    md: 'min-h-8 w-full rounded-md py-1 pr-8 pl-3 text-[0.8125rem]',
    sm: 'h-6 min-w-20 rounded py-0 pr-7 pl-2 text-[0.6875rem]',
}

const POPOVER_GAP = 4
const POPOVER_MAX_HEIGHT = 288

function matches(option, term) {
    const needle = term.trim().toLowerCase()

    return needle === '' || option.label.toLowerCase().includes(needle) || String(option.value).toLowerCase().includes(needle)
}

function selectedValues(value, multiple) {
    if (multiple) {
        return value ?? []
    }

    return value === '' || value === null || value === undefined ? [] : [value]
}

function usePopoverPosition(open, trigger) {
    const [position, setPosition] = useState(null)

    useLayoutEffect(() => {
        if (!open) {
            return undefined
        }

        function place() {
            const rect = trigger.current.getBoundingClientRect()
            const below = window.innerHeight - rect.bottom
            const above = rect.top > below && below < POPOVER_MAX_HEIGHT

            setPosition({
                left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, 256) - 8),
                minWidth: Math.max(rect.width, 256),
                ...(above ? { bottom: window.innerHeight - rect.top + POPOVER_GAP } : { top: rect.bottom + POPOVER_GAP }),
            })
        }

        place()
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)

        return () => {
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
        }
    }, [open, trigger])

    return position
}

function TriggerLabel({ chosen, placeholder, multiple }) {
    if (chosen.length === 0) {
        return <span className="truncate text-zinc-400">{placeholder}</span>
    }

    if (!multiple || chosen.length === 1) {
        return <span className="truncate">{chosen[0].label}</span>
    }

    return (
        <span className="flex min-w-0 items-center gap-1">
            <span className="truncate">{chosen[0].label}</span>
            <span className="shrink-0 rounded bg-zinc-100 px-1 text-[0.6875rem] text-zinc-600 tabular-nums">+{chosen.length - 1}</span>
        </span>
    )
}

export function Combobox({
    options,
    value,
    onChange,
    multiple = false,
    placeholder = strings.choose,
    searchPlaceholder = strings.search,
    empty = strings.noOptions,
    size = 'md',
    invalid = false,
    clearable = false,
    disabled = false,
    onSearch,
    className,
    'aria-label': ariaLabel,
}) {
    const [open, setOpen] = useState(false)
    const [term, setTerm] = useState('')
    const [active, setActive] = useState(0)
    const trigger = useRef(null)
    const popover = useRef(null)
    const list = useRef(null)
    const position = usePopoverPosition(open, trigger)
    const values = selectedValues(value, multiple)
    const chosen = values.map(
        (current) =>
            options.find((option) => option.value === current) ?? {
                value: current,
                label: current,
            },
    )
    const found = useMemo(() => options.filter((option) => matches(option, term)), [options, term])

    useEffect(() => {
        if (!open) {
            return undefined
        }

        function close(event) {
            if (!trigger.current?.contains(event.target) && !popover.current?.contains(event.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', close)

        return () => document.removeEventListener('mousedown', close)
    }, [open])

    useEffect(() => {
        list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
    }, [active])

    function show() {
        setTerm('')
        onSearch?.('')
        setActive(0)
        setOpen(true)
    }

    function hide() {
        setOpen(false)
        trigger.current?.focus()
    }

    function choose(option) {
        if (!multiple) {
            onChange(option.value)
            hide()

            return
        }

        onChange(values.includes(option.value) ? values.filter((current) => current !== option.value) : [...values, option.value])
    }

    function onKeyDown(event) {
        const moves = { ArrowDown: 1, ArrowUp: -1 }

        if (moves[event.key]) {
            event.preventDefault()
            setActive((index) => Math.min(Math.max(index + moves[event.key], 0), found.length - 1))
        }

        if (event.key === 'Enter' && found[active]) {
            event.preventDefault()
            choose(found[active])
        }

        if (event.key === 'Escape' || event.key === 'Tab') {
            event.stopPropagation()
            hide()
        }
    }

    return (
        <span className={cn('relative', size === 'md' ? 'flex w-full' : 'inline-flex', className)}>
            <button
                ref={trigger}
                type="button"
                disabled={disabled}
                onClick={() => (open ? setOpen(false) : show())}
                onKeyDown={(event) => ['ArrowDown', 'Enter', ' '].includes(event.key) && !open && (event.preventDefault(), show())}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                className={cn(
                    'flex w-full items-center border bg-white text-left text-zinc-900 tabular-nums transition focus:outline-none disabled:opacity-50',
                    invalid ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500' : 'border-zinc-300 focus:border-brand',
                    open && !invalid && 'border-brand',
                    TRIGGER_SIZES[size],
                )}
            >
                <TriggerLabel chosen={chosen} placeholder={placeholder} multiple={multiple} />
            </button>
            {clearable && chosen.length > 0 && !disabled ? (
                <button
                    type="button"
                    onClick={() => onChange(multiple ? [] : '')}
                    aria-label={strings.clearValue}
                    className={cn('absolute top-1/2 -translate-y-1/2 rounded text-zinc-400 hover:text-zinc-700', size === 'md' ? 'right-2' : 'right-1.5')}
                >
                    <X className={size === 'md' ? 'size-3.5' : 'size-3'} />
                </button>
            ) : (
                <ChevronDown className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-zinc-500', size === 'md' ? 'right-2.5 size-3.5' : 'right-2 size-3')} />
            )}
            {open &&
                position &&
                createPortal(
                    <div
                        ref={popover}
                        data-floating
                        onKeyDown={onKeyDown}
                        style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, minWidth: position.minWidth }}
                        className={cn('z-50 max-w-md rounded-md border border-zinc-200 bg-white shadow-lg', popoverMotion(position))}
                    >
                        <div className="flex items-center gap-1.5 border-b border-zinc-100 px-2.5">
                            <Search className="size-3.5 shrink-0 text-zinc-400" />
                            <input
                                autoFocus
                                value={term}
                                onChange={(event) => {
                                    setTerm(event.target.value)
                                    onSearch?.(event.target.value)
                                    setActive(0)
                                }}
                                placeholder={searchPlaceholder}
                                className="h-8 w-full bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                            />
                        </div>
                        <ul ref={list} role="listbox" aria-multiselectable={multiple} className="max-h-64 overflow-y-auto py-1">
                            {found.map((option, index) => {
                                const selected = values.includes(option.value)

                                return (
                                    <li
                                        key={option.value}
                                        role="option"
                                        aria-selected={selected}
                                        onMouseEnter={() => setActive(index)}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => choose(option)}
                                        className={cn('flex cursor-pointer items-center gap-2 px-2.5 py-1 text-xs text-zinc-700', index === active && 'bg-zinc-100')}
                                    >
                                        <Check className={cn('size-3 shrink-0', selected ? 'text-brand' : 'invisible')} />
                                        <span className="flex-1 truncate">{option.label}</span>
                                        {option.meta && <span className="shrink-0 text-[0.6875rem] text-zinc-400">{option.meta}</span>}
                                    </li>
                                )
                            })}
                            {found.length === 0 && <li className="px-2.5 py-2 text-xs text-zinc-400">{empty}</li>}
                        </ul>
                    </div>,
                    document.body,
                )}
        </span>
    )
}
