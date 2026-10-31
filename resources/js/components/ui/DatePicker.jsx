import { CalendarDays, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../lib/cn'
import { popoverMotion } from '../../lib/motion'
import { clampDate, dayOf, formatThaiDate, nowTime, timeOf, todayKey } from '../../lib/thaiDate'

import { Calendar } from './Calendar'
import { strings } from '../../lib/strings'

const POPOVER_GAP = 4
/** Panel height in rem, so the flip-up still works under the shell's 125% rem base. */
const POPOVER_HEIGHT_REM = 21

/** The trigger frame shared by DatePicker and DateRangePicker: the kit control border, brand while open. */
export function pickerFrame({ open, invalid, disabled }) {
    return cn(
        'relative flex w-full items-center rounded-md border bg-white text-[0.8125rem] text-zinc-900 tabular-nums transition',
        invalid ? 'border-red-400 ring-1 ring-red-200' : open ? 'border-brand' : 'border-zinc-300 focus-within:border-brand',
        disabled && 'opacity-50',
    )
}

/** Same placement as the Combobox list: fixed under the trigger, flipped up near the viewport bottom. */
function usePanelPosition(anchor, widthRem) {
    const [position, setPosition] = useState(null)

    useLayoutEffect(() => {
        function place() {
            const rect = anchor.current.getBoundingClientRect()
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
            const below = window.innerHeight - rect.bottom
            const above = rect.top > below && below < POPOVER_HEIGHT_REM * rem

            setPosition({
                left: Math.max(8, Math.min(rect.left, window.innerWidth - widthRem * rem - 8)),
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
    }, [anchor, widthRem])

    return position
}

/**
 * The picker's portalled panel. Closes on a click outside it and its trigger, on Tab
 * out of it, and on Esc — which it keeps from reaching a surrounding Dialog, so Esc in
 * a FormDialog closes the calendar, not the form.
 */
export function PickerPanel({ anchor, label, widthRem = 17, onClose, onEscape, children }) {
    const panel = useRef(null)
    const close = useRef(onClose)
    const position = usePanelPosition(anchor, widthRem)

    useEffect(() => {
        close.current = onClose
    })

    useEffect(() => {
        function onMouseDown(event) {
            if (!anchor.current?.contains(event.target) && !panel.current?.contains(event.target)) {
                close.current()
            }
        }

        document.addEventListener('mousedown', onMouseDown)

        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [anchor])

    if (!position) {
        return null
    }

    return createPortal(
        <div
            ref={panel}
            data-floating
            role="dialog"
            aria-label={label}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.stopPropagation()
                    onEscape()
                }
            }}
            onBlur={(event) => {
                if (event.relatedTarget && !panel.current?.contains(event.relatedTarget) && !anchor.current?.contains(event.relatedTarget)) {
                    onClose()
                }
            }}
            style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom }}
            className={cn('z-50 rounded-md border border-zinc-200 bg-white shadow-lg', popoverMotion(position))}
        >
            {children}
        </div>,
        document.body,
    )
}

const pad = (number) => String(number).padStart(2, '0')

function TimePart({ value, max, label, onCommit, inputRef, onFilled }) {
    const [draft, setDraft] = useState(null)

    function commit(text) {
        setDraft(null)

        if (text !== '') {
            onCommit(Math.min(Number(text), max))
        }
    }

    return (
        <input
            ref={inputRef}
            value={draft ?? pad(value)}
            onFocus={(event) => event.target.select()}
            onChange={(event) => {
                const text = event.target.value.replace(/\D/g, '').slice(0, 2)

                setDraft(text)

                if (text.length === 2) {
                    commit(text)
                    onFilled?.()
                }
            }}
            onBlur={() => draft !== null && commit(draft)}
            onKeyDown={(event) => {
                const step = { ArrowUp: 1, ArrowDown: -1 }[event.key]

                if (step) {
                    event.preventDefault()
                    onCommit((value + step + max + 1) % (max + 1))
                }
            }}
            inputMode="numeric"
            aria-label={label}
            className="h-6 w-7 rounded border border-zinc-300 bg-white text-center text-xs text-zinc-900 tabular-nums focus:border-brand focus:outline-none"
        />
    )
}

/** `HH : mm` — two 2-digit fields; typing two digits jumps to minutes, ↑/↓ step and wrap. */
export function TimeField({ value, onChange, label = strings.time }) {
    const [hour, minute] = value.split(':').map(Number)
    const minuteInput = useRef(null)

    return (
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            {label}
            <TimePart value={hour} max={23} label={`${label} ${strings.hour}`} onCommit={(next) => onChange(`${pad(next)}:${pad(minute)}`)} onFilled={() => minuteInput.current?.focus()} />
            <span className="text-zinc-400">:</span>
            <TimePart value={minute} max={59} label={`${label} ${strings.minute}`} inputRef={minuteInput} onCommit={(next) => onChange(`${pad(hour)}:${pad(next)}`)} />
        </span>
    )
}

/**
 * A Thai Buddhist-era date or date-time picker. `value`, `min` and `max` are the strings a
 * native input uses — `Y-m-d`, or `Y-m-d\TH:i` with `time` — and `''` is empty, so useForm
 * data and Laravel's `date` rules don't change; only the display is พ.ศ. ("19 ต.ค. 69",
 * 2569 in the calendar header). A date closes on pick; a date-time stays open for the time
 * and closes on `confirmLabel` (เลือก). `highlight` ({start, end}) draws a range band, for
 * a start / end pair kept as two pickers rather than a DateRangePicker.
 *
 * @param {{value: string, onChange: (value: string) => void, time?: boolean, min?: string|null, max?: string|null, defaultTime?: string, placeholder?: string, confirmLabel?: string, highlight?: {start: string|null, end: string|null}|null, clearable?: boolean, invalid?: boolean, disabled?: boolean, id?: string, className?: string, 'aria-label'?: string}} props
 */
export function DatePicker({
    value,
    onChange,
    time = false,
    min = null,
    max = null,
    defaultTime = '00:00',
    placeholder = strings.pickDate,
    confirmLabel = strings.pick,
    highlight = null,
    clearable = false,
    invalid = false,
    disabled = false,
    id,
    className,
    'aria-label': ariaLabel,
}) {
    const [open, setOpen] = useState(false)
    const anchor = useRef(null)
    const trigger = useRef(null)
    const current = value || null

    function emit(next) {
        onChange(next === null ? '' : clampDate(next, min, max))
    }

    function hide() {
        setOpen(false)
        trigger.current?.focus()
    }

    function pickDay(key) {
        if (!time) {
            emit(key)
            hide()

            return
        }

        emit(`${key}T${timeOf(current) ?? defaultTime}`)
    }

    return (
        <span ref={anchor} className={cn(pickerFrame({ open, invalid, disabled }), className)}>
            <button
                ref={trigger}
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                onKeyDown={(event) => ['ArrowDown', 'Enter', ' '].includes(event.key) && !open && (event.preventDefault(), setOpen(true))}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={ariaLabel && current ? `${ariaLabel} ${formatThaiDate(current)}` : ariaLabel}
                className="flex h-8 min-w-0 flex-1 items-center rounded-md pr-14 pl-3 text-left focus:outline-none"
            >
                {current ? <span className="truncate">{formatThaiDate(current)}</span> : <span className="truncate text-zinc-400">{placeholder}</span>}
            </button>
            <span className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                {clearable && current && !disabled && (
                    <button type="button" onClick={() => emit(null)} aria-label={strings.clearValue} className="rounded p-0.5 text-zinc-400 hover:text-zinc-700">
                        <X className="size-3.5" />
                    </button>
                )}
                <button type="button" tabIndex={-1} disabled={disabled} onClick={() => setOpen(!open)} aria-label={strings.openCalendar} className="rounded p-0.5 text-zinc-500 hover:text-zinc-800">
                    <CalendarDays className="size-3.5" />
                </button>
            </span>
            {open && (
                <PickerPanel anchor={anchor} label={ariaLabel ? strings.pickNamed(ariaLabel) : strings.pickDate} onClose={() => setOpen(false)} onEscape={hide}>
                    <Calendar selected={dayOf(current)} min={dayOf(min)} max={dayOf(max)} onSelect={pickDay} range={highlight ?? undefined} autoFocus />
                    <div className="flex items-center gap-2 border-t border-zinc-100 px-2 py-1.5">
                        <button
                            type="button"
                            onClick={() => (time ? emit(`${todayKey()}T${nowTime()}`) : pickDay(todayKey()))}
                            className="rounded px-1.5 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                            {time ? strings.now : strings.today}
                        </button>
                        {time && (
                            <>
                                <span className="ml-auto" />
                                <TimeField value={timeOf(current) ?? defaultTime} onChange={(hhmm) => emit(`${dayOf(current) ?? todayKey()}T${hhmm}`)} />
                                <button type="button" onClick={hide} className="rounded border border-zinc-300 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-50">
                                    {confirmLabel}
                                </button>
                            </>
                        )}
                    </div>
                </PickerPanel>
            )}
        </span>
    )
}

/** Date + time: value `Y-m-d\TH:i`, the `datetime-local` format. */
export function DateTimePicker(props) {
    return <DatePicker placeholder={strings.pickDateTime} {...props} time />
}
