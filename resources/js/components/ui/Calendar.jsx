import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { addDays, addMonths, BE_OFFSET, dayKey, formatSpokenDate, monthOf, parseIso, THAI_MONTHS, THAI_WEEKDAYS, todayKey } from '../../lib/thaiDate'
import { strings } from '../../lib/strings'

const KEY_MOVES = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }

/** Day numbers in rows of seven, null for the blanks before the 1st and after the last day. */
function weeks(lead, length) {
    const cells = [...Array(lead).fill(null), ...Array.from({ length }, (_, index) => index + 1)]

    while (cells.length % 7) {
        cells.push(null)
    }

    return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7))
}

function outOfRange(key, min, max) {
    return Boolean((min && key < min) || (max && key > max))
}

/** The same day number in another month, capped at that month's last day. */
function sameDayIn(focusKey, monthKey) {
    const { d } = parseIso(focusKey)
    const { y, m } = parseIso(monthKey)

    return dayKey(y, m, Math.min(d, new Date(y, m, 0).getDate()))
}

/**
 * Where a day sits in a range band: start / end cap, inside, or none. `end` falls back
 * to the hovered day while the end is still being picked, as a preview.
 */
function bandOf(key, range) {
    if (!range?.start) {
        return { cap: null, inside: false, preview: false }
    }

    const preview = !range.end && Boolean(range.hover) && range.hover > range.start
    const end = range.end ?? (preview ? range.hover : null)

    return {
        cap: key === range.start ? 'start' : key === end ? 'end' : null,
        inside: Boolean(end) && key > range.start && key < end,
        open: Boolean(end) && end > range.start,
        preview,
    }
}

const BAND = {
    inside: 'bg-zinc-100',
    start: 'bg-[linear-gradient(to_right,transparent_50%,var(--color-zinc-100)_50%)]',
    end: 'bg-[linear-gradient(to_left,transparent_50%,var(--color-zinc-100)_50%)]',
}

/**
 * The month grid behind DatePicker / DateRangePicker, after Filament's ThaiDatePicker: month select + พ.ศ. year
 * field in the header, Monday-first grid, roving focus with the usual grid keys
 * (arrows, PageUp/PageDown month, Shift+Page year, Home/End week, Enter/Space pick).
 *
 * Uncontrolled it keeps its own focus and month. A range picker showing two months
 * controls both (`focusKey` + `onFocusKeyChange`, `month` + `onMonthChange`) and passes
 * `range` ({start, end, hover}) to draw the band; `nav` hides the arrow a side doesn't own.
 *
 * @param {{selected?: string|null, min?: string|null, max?: string|null, onSelect: (key: string) => void, autoFocus?: boolean, range?: {start: string|null, end: string|null, hover?: string|null}, onHover?: (key: string|null) => void, focusKey?: string, onFocusKeyChange?: (key: string) => void, month?: string, onMonthChange?: (key: string) => void, nav?: 'both'|'prev'|'next'}} props day keys (Y-m-d)
 */
export function Calendar({ selected = null, min, max, onSelect, autoFocus = false, range, onHover, focusKey: focusProp, onFocusKeyChange, month: monthProp, onMonthChange, nav = 'both' }) {
    const [ownFocus, setOwnFocus] = useState(() => selected ?? range?.start ?? (outOfRange(todayKey(), min, max) ? (min ?? max) : todayKey()))
    const [yearText, setYearText] = useState(null)
    const grid = useRef(null)
    const pendingFocus = useRef(autoFocus)
    const focusKey = focusProp ?? ownFocus
    const setFocus = onFocusKeyChange ?? setOwnFocus
    const monthKey = monthProp ?? monthOf(focusKey)
    const setMonth = onMonthChange ?? ((key) => setOwnFocus(sameDayIn(focusKey, key)))
    const { y, m } = parseIso(monthKey)
    const today = todayKey()
    const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
    const length = new Date(y, m, 0).getDate()

    useEffect(() => {
        const root = grid.current?.closest('[data-floating]') ?? grid.current
        const active = document.activeElement
        const keyboarding = Boolean(active?.dataset?.day) && root?.contains(active)

        if ((keyboarding || pendingFocus.current) && active?.dataset?.day !== focusKey) {
            const target = root?.querySelector(`[data-day="${focusKey}"]`)

            if (target) {
                target.focus()
                pendingFocus.current = false
            }
        }
    }, [focusKey, monthKey])

    function onGridKey(event) {
        const weekday = (new Date(parseIso(focusKey).y, parseIso(focusKey).m - 1, parseIso(focusKey).d).getDay() + 6) % 7
        const shifts = { ...KEY_MOVES, Home: -weekday, End: 6 - weekday }

        if (event.key in shifts) {
            event.preventDefault()
            event.stopPropagation()
            setFocus(addDays(focusKey, shifts[event.key]))
        }

        if (event.key === 'PageUp' || event.key === 'PageDown') {
            event.preventDefault()
            event.stopPropagation()
            setFocus(addMonths(focusKey, (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1)))
        }
    }

    function setYear(text) {
        setYearText(text)

        if (/^\d{4}$/.test(text) && Number(text) > 2400) {
            setMonth(addMonths(monthKey, (Number(text) - BE_OFFSET - y) * 12))
        }
    }

    function pick(key) {
        setFocus(key)
        onSelect(key)
    }

    const arrow = 'inline-flex size-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'

    return (
        <div className="w-[15.5rem] select-none">
            <div className="flex items-center gap-1 px-2 pt-2 pb-1">
                {nav !== 'next' ? (
                    <button type="button" onClick={() => setMonth(addMonths(monthKey, -1))} aria-label={strings.previousMonth} className={arrow}>
                        <ChevronLeft className="size-3.5" />
                    </button>
                ) : (
                    <span className="size-6" />
                )}
                <select
                    value={m}
                    onChange={(event) => setMonth(dayKey(y, Number(event.target.value), 1))}
                    aria-label={strings.month}
                    className="h-6 min-w-0 flex-1 cursor-pointer appearance-none rounded border border-transparent bg-transparent px-1.5 text-xs font-semibold text-zinc-800 hover:border-zinc-200 focus:border-brand focus:outline-none"
                >
                    {THAI_MONTHS.map((label, index) => (
                        <option key={label} value={index + 1}>
                            {label}
                        </option>
                    ))}
                </select>
                <input
                    value={yearText ?? String(y + BE_OFFSET)}
                    onChange={(event) => setYear(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    onBlur={() => setYearText(null)}
                    onKeyDown={(event) => {
                        const step = { ArrowUp: 12, ArrowDown: -12 }[event.key]

                        if (step) {
                            event.preventDefault()
                            setYearText(null)
                            setMonth(addMonths(monthKey, step))
                        }
                    }}
                    inputMode="numeric"
                    aria-label={strings.yearBE}
                    className="h-6 w-14 rounded border border-transparent bg-transparent px-1.5 text-right text-xs font-semibold text-zinc-800 tabular-nums hover:border-zinc-200 focus:border-brand focus:outline-none"
                />
                {nav !== 'prev' ? (
                    <button type="button" onClick={() => setMonth(addMonths(monthKey, 1))} aria-label={strings.nextMonth} className={arrow}>
                        <ChevronRight className="size-3.5" />
                    </button>
                ) : (
                    <span className="size-6" />
                )}
            </div>
            <div role="grid" aria-label={`${THAI_MONTHS[m - 1]} ${y + BE_OFFSET}`} ref={grid} onKeyDown={onGridKey} onMouseLeave={() => onHover?.(null)} className="px-2 pb-2">
                <div role="row" className="grid grid-cols-7">
                    {THAI_WEEKDAYS.map((label) => (
                        <div key={label} role="columnheader" className="py-1 text-center text-[0.625rem] font-medium text-zinc-400">
                            {label}
                        </div>
                    ))}
                </div>
                {weeks(lead, length).map((week, row) => (
                    <div key={row} role="row" className="grid grid-cols-7 py-px">
                        {week.map((day, column) => {
                            if (day === null) {
                                return <div key={`blank-${column}`} role="gridcell" />
                            }

                            const key = dayKey(y, m, day)
                            const disabled = outOfRange(key, min, max)
                            const band = bandOf(key, range)
                            const isSelected = key === selected || (band.cap && !(band.cap === 'end' && band.preview))

                            return (
                                <div
                                    key={key}
                                    role="gridcell"
                                    aria-selected={Boolean(isSelected)}
                                    className={cn('flex justify-center', band.inside && BAND.inside, band.cap && band.open && BAND[band.cap])}
                                >
                                    <button
                                        type="button"
                                        data-day={key}
                                        tabIndex={key === focusKey ? 0 : -1}
                                        aria-label={formatSpokenDate(key)}
                                        aria-current={key === today ? 'date' : undefined}
                                        aria-disabled={disabled || undefined}
                                        onClick={() => !disabled && pick(key)}
                                        onMouseEnter={() => onHover?.(disabled ? null : key)}
                                        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), !disabled && pick(key))}
                                        className={cn(
                                            'inline-flex size-7 items-center justify-center rounded text-xs tabular-nums transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                                            isSelected ? 'bg-zinc-900 font-semibold text-white' : 'text-zinc-700 hover:bg-zinc-200/70',
                                            band.cap === 'end' && band.preview && 'font-semibold text-zinc-900 ring-1 ring-zinc-400 ring-inset',
                                            key === today && !isSelected && 'font-semibold text-zinc-900 ring-1 ring-zinc-300 ring-inset',
                                            disabled && 'cursor-not-allowed text-zinc-300 hover:bg-transparent',
                                        )}
                                    >
                                        {day}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
