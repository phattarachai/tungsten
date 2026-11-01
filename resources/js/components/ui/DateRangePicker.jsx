import { ArrowRight, CalendarDays, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { addMonths, clampDate, dayOf, formatThaiDate, monthOf, timeOf, todayKey } from '../../lib/thaiDate'

import { Calendar } from './Calendar'
import { pickerFrame, PickerPanel, TimeField } from './DatePicker'
import { strings } from '../../lib/strings'

/**
 * A start / end pair for a record that keeps them as two fields (`start_date`, `end_date`):
 * one frame split into เริ่ม → สิ้นสุด halves over a two-month calendar. Each half edits only
 * its own end and keeps the other (extending an end date is one click); picking a start
 * moves on to the end, and a day before the start becomes the new start. While the end is
 * open the band follows the pointer.
 *
 * `start` / `end` are the DatePicker strings (`Y-m-d`, or `Y-m-d\TH:i` with `time`) and
 * `onChange({start, end})` hands both back. Without `time` picking the end closes the panel;
 * with it the footer holds both times and the panel closes on `confirmLabel` (เลือก).
 * `presets` (`{label, range: () => [startKey, endKey]}`) add quick-range chips.
 *
 * @param {{start: string, end: string, onChange: (range: {start: string, end: string}) => void, time?: boolean, min?: string|null, max?: string|null, defaultStartTime?: string, defaultEndTime?: string, presets?: list<{label: string, range: () => [string, string]}>|null, confirmLabel?: string, clearable?: boolean, invalid?: boolean, disabled?: boolean, 'aria-label'?: string}} props
 */
export function DateRangePicker({
    start,
    end,
    onChange,
    time = false,
    min = null,
    max = null,
    defaultStartTime = '00:00',
    defaultEndTime = '23:59',
    presets = null,
    confirmLabel = strings.pick,
    clearable = false,
    invalid = false,
    disabled = false,
    'aria-label': ariaLabel = strings.dateRange,
    className,
}) {
    const [open, setOpen] = useState(false)
    const [phase, setPhase] = useState('start')
    const [hover, setHover] = useState(null)
    const [month, setMonth] = useState(() => monthOf(dayOf(start) ?? todayKey()))
    const [focusKey, setFocusKey] = useState(() => dayOf(start) ?? todayKey())
    const anchor = useRef(null)
    const startDay = dayOf(start || null)
    const endDay = dayOf(end || null)
    const withTime = (key, hhmm) => (time ? `${key}T${hhmm}` : key)

    function show(nextPhase) {
        const day = (nextPhase === 'end' ? (endDay ?? startDay) : startDay) ?? todayKey()
        const startsMonthBefore = nextPhase === 'end' && startDay && monthOf(startDay) === addMonths(monthOf(day), -1)

        setPhase(nextPhase)
        setFocusKey(day)
        setMonth(startsMonthBefore ? monthOf(startDay) : monthOf(day))
        setHover(null)
        setOpen(true)
    }

    function hide() {
        setOpen(false)
        anchor.current?.querySelector(`[data-half="${phase}"]`)?.focus()
    }

    function moveFocus(key) {
        setFocusKey(key)

        if (monthOf(key) < month) {
            setMonth(monthOf(key))
        } else if (monthOf(key) > addMonths(month, 1)) {
            setMonth(addMonths(monthOf(key), -1))
        }
    }

    function emit(nextStart, nextEnd) {
        onChange({ start: nextStart ? clampDate(nextStart, min, max) : '', end: nextEnd ? clampDate(nextEnd, min, max) : '' })
    }

    function pickDay(key) {
        if (phase === 'start' || !startDay || key < startDay) {
            emit(withTime(key, timeOf(start) ?? defaultStartTime), endDay && endDay >= key ? end : '')
            setPhase('end')

            return
        }

        emit(start, withTime(key, timeOf(end) ?? defaultEndTime))

        if (!time) {
            hide()
        }
    }

    function applyPreset(preset) {
        const [presetStart, presetEnd] = preset.range()

        emit(withTime(presetStart, defaultStartTime), withTime(presetEnd, defaultEndTime))
        setMonth(monthOf(presetStart))

        if (!time) {
            hide()
        }
    }

    function half(which, value, placeholder) {
        return (
            <button
                type="button"
                data-half={which}
                disabled={disabled}
                onClick={() => (open && phase === which ? setOpen(false) : show(which))}
                onKeyDown={(event) => ['ArrowDown', 'Enter', ' '].includes(event.key) && !open && (event.preventDefault(), show(which))}
                aria-haspopup="dialog"
                aria-expanded={open && phase === which}
                aria-label={`${placeholder} ${value ? formatThaiDate(value) : ''}`.trim()}
                className={cn(
                    'flex h-8 min-w-0 flex-1 items-center px-3 text-left focus:outline-none',
                    which === 'start' ? 'rounded-l-md' : 'pr-14',
                    open && phase === which && 'bg-zinc-50 shadow-[inset_0_-2px_0_var(--color-zinc-900)]',
                )}
            >
                {value ? <span className="truncate">{formatThaiDate(value)}</span> : <span className="truncate text-zinc-400">{placeholder}</span>}
            </button>
        )
    }

    return (
        <span ref={anchor} className={pickerFrame({ open, invalid, disabled, className })}>
            {half('start', start, strings.startDate)}
            <ArrowRight className="size-3 shrink-0 text-zinc-400" />
            {half('end', end, strings.endDate)}
            <span className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                {clearable && (start || end) && !disabled && (
                    <button type="button" onClick={() => emit('', '')} aria-label={strings.clearValue} className="rounded p-0.5 text-zinc-400 hover:text-zinc-700">
                        <X className="size-3.5" />
                    </button>
                )}
                <button type="button" tabIndex={-1} disabled={disabled} onClick={() => (open ? setOpen(false) : show('start'))} aria-label={strings.openCalendar} className="rounded p-0.5 text-zinc-500 hover:text-zinc-800">
                    <CalendarDays className="size-3.5" />
                </button>
            </span>
            {open && (
                <PickerPanel anchor={anchor} label={strings.pickNamed(ariaLabel)} widthRem={33} onClose={() => setOpen(false)} onEscape={hide}>
                    <div className="flex divide-x divide-zinc-100">
                        {[0, 1].map((offset) => (
                            <Calendar
                                key={offset}
                                min={dayOf(min)}
                                max={dayOf(max)}
                                onSelect={pickDay}
                                range={{ start: startDay, end: endDay, hover: phase === 'end' ? hover : null }}
                                onHover={setHover}
                                focusKey={focusKey}
                                onFocusKeyChange={moveFocus}
                                month={addMonths(month, offset)}
                                onMonthChange={(key) => setMonth(addMonths(key, -offset))}
                                nav={offset === 0 ? 'prev' : 'next'}
                                autoFocus
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 border-t border-zinc-100 px-2 py-1.5">
                        {presets ? (
                            <span className="flex flex-wrap gap-1">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => applyPreset(preset)}
                                        className="rounded border border-zinc-200 px-1.5 py-0.5 text-[0.6875rem] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </span>
                        ) : (
                            <span className="px-1 text-[0.6875rem] text-zinc-400">{phase === 'end' ? strings.pickEndDate : strings.pickStartDate}</span>
                        )}
                        {time && (
                            <>
                                <span className="ml-auto" />
                                <TimeField label={strings.start} value={timeOf(start) ?? defaultStartTime} onChange={(hhmm) => emit(`${startDay ?? todayKey()}T${hhmm}`, end)} />
                                <TimeField label={strings.end} value={timeOf(end) ?? defaultEndTime} onChange={(hhmm) => emit(start, `${endDay ?? startDay ?? todayKey()}T${hhmm}`)} />
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
