import { usePage } from '@inertiajs/react'
import { FilterX, SlidersHorizontal, X } from 'lucide-react'
import { isValidElement, useState } from 'react'

import { ButtonGroup } from './ButtonGroup'
import { Combobox } from './Combobox'
import { DateRangePicker } from './DateRangePicker'
import { Dropdown } from './Dropdown'
import { FilterBar, FilterField } from './FilterBar'
import { IconButton } from './IconButton'
import { Pills } from './Pills'
import { SearchInput } from './SearchInput'
import { Switch } from './Switch'
import { TableToolbar } from './TableToolbar'
import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'
import { formatThaiDate } from '../../lib/thaiDate'

const ALL = 'all'
const CUSTOM = 'custom'

function isEmpty(value) {
    return value === null || value === undefined || value === '' || value === false || (Array.isArray(value) && value.length === 0)
}

function rangeKeys(filter) {
    return { from: filter.from ?? 'from', to: filter.to ?? 'to' }
}

/** The query keys a filter writes: its own, plus a `dates` filter's range ends. */
function keysOf(filter) {
    if (filter.type !== 'dates') {
        return [filter.key]
    }

    const { from, to } = rangeKeys(filter)

    return [filter.key, from, to]
}

function hasRange(filter, values) {
    const { from, to } = rangeKeys(filter)

    return !isEmpty(values[from]) || !isEmpty(values[to])
}

function isActive(filter, values) {
    const value = values[filter.key]

    if (filter.type === 'dates') {
        return hasRange(filter, values) || (!isEmpty(value) && value !== ALL)
    }

    if (filter.type === 'toggle') {
        return !isEmpty(value) && value !== '0' && value !== 0
    }

    return !isEmpty(value) && String(value) !== String(filter.default ?? '')
}

function labelOf(filter, value) {
    return filter.options?.find((option) => String(option.value) === String(value))?.label ?? String(value)
}

function cleared(filter) {
    return Object.fromEntries(keysOf(filter).map((key) => [key, null]))
}

function rangeLabel(filter, values) {
    const { from, to } = rangeKeys(filter)

    return [values[from], values[to]].map((day) => (day ? formatThaiDate(day) : '…')).join(' – ')
}

/**
 * The active filters as chips: one per value of a multiple filter, each with the change that clears it.
 */
function chipsOf(filters, values) {
    return filters.flatMap((filter) => {
        const value = values[filter.key]

        if (!isActive(filter, values)) {
            return []
        }

        if (filter.chip) {
            return [{ key: filter.key, label: filter.chip(value, values), clear: cleared(filter) }]
        }

        if (filter.type === 'toggle') {
            return [{ key: filter.key, label: filter.label, clear: cleared(filter) }]
        }

        if (filter.type === 'dates') {
            const ranged = isEmpty(value) || value === CUSTOM

            return [{ key: filter.key, label: `${filter.label}: ${ranged ? rangeLabel(filter, values) : labelOf(filter, value)}`, clear: cleared(filter) }]
        }

        if (Array.isArray(value)) {
            return value.map((entry) => ({
                key: `${filter.key}-${entry}`,
                label: `${filter.label}: ${labelOf(filter, entry)}`,
                clear: { [filter.key]: value.filter((current) => current !== entry) },
            }))
        }

        return [{ key: filter.key, label: `${filter.label}: ${labelOf(filter, value)}`, clear: cleared(filter) }]
    })
}

/**
 * Date presets (`options`) with "ทั้งหมด" first and "กำหนดเอง" last; the custom one opens a range picker that writes
 * the `from` / `to` keys. Picking a preset clears the range, picking a range clears the preset.
 */
function DatesControl({ filter, values, onChange, ranges }) {
    const { from, to } = rangeKeys(filter)
    const ranged = hasRange(filter, values)
    const custom = ranges.isOpen(filter.key)
    const setCustom = (open) => ranges.set(filter.key, open)
    const preset = ranged || custom ? CUSTOM : (values[filter.key] ?? ALL)
    const options = [{ value: ALL, label: filter.allLabel ?? strings.all }, ...(filter.options ?? []), { value: CUSTOM, label: filter.customLabel ?? strings.customDates }]

    function pick(value) {
        setCustom(value === CUSTOM)

        if (value !== CUSTOM) {
            onChange({ [filter.key]: value === ALL ? null : value, [from]: null, [to]: null })
        }
    }

    return (
        <span className="inline-flex flex-wrap items-center gap-2">
            <ButtonGroup size="sm" options={options} value={preset} onChange={pick} />
            {preset === CUSTOM && (
                <span className="w-64 max-w-full">
                    <DateRangePicker
                        start={values[from] ?? ''}
                        end={values[to] ?? ''}
                        onChange={({ start, end }) => onChange({ [filter.key]: null, [from]: start || null, [to]: end || null })}
                        clearable
                        aria-label={filter.label}
                    />
                </span>
            )}
        </span>
    )
}

/**
 * Which `dates` filters have their custom range open before a date is picked (so "กำหนดเอง" stays selected, counts
 * as a set filter, and clear-all closes it).
 */
function useOpenRanges(filters, values) {
    const [open, setOpen] = useState(() => filters.filter((filter) => filter.type === 'dates' && hasRange(filter, values)).map((filter) => filter.key))

    return {
        isOpen: (key) => open.includes(key),
        set: (key, isOpen) => setOpen((current) => (isOpen ? [...new Set([...current, key])] : current.filter((entry) => entry !== key))),
        clear: () => setOpen([]),
        any: open.length > 0,
    }
}

function Control({ filter, values, onChange, size, ranges, labelled = false }) {
    const value = values[filter.key]
    const set = (next) => onChange({ [filter.key]: isEmpty(next) ? null : next })
    const withLabel = (control) => (labelled && filter.label ? <FilterField label={filter.label}>{control}</FilterField> : control)

    if (filter.type === 'custom') {
        return filter.render({ value, values, onChange: set, change: onChange, size })
    }

    if (filter.type === 'dates') {
        return <DatesControl filter={filter} values={values} onChange={onChange} ranges={ranges} />
    }

    if (filter.type === 'buttons') {
        return withLabel(<ButtonGroup size="sm" options={filter.options} value={value ?? filter.default ?? ''} onChange={set} />)
    }

    if (filter.type === 'pills') {
        return withLabel(<Pills options={filter.options} value={value ?? filter.default ?? ''} onChange={set} />)
    }

    if (filter.type === 'toggle') {
        return (
            <label className="inline-flex items-center gap-1.5 text-[0.6875rem] text-zinc-600">
                <Switch checked={isActive(filter, values)} onChange={(on) => set(on ? 1 : null)} label={filter.label} />
                {size === 'sm' && filter.label}
            </label>
        )
    }

    return (
        <Combobox
            size={size}
            label={size === 'sm' ? filter.label : undefined}
            multiple={filter.multiple}
            clearable
            options={filter.options}
            value={value ?? (filter.multiple ? [] : '')}
            onChange={set}
            placeholder={strings.all}
            searchPlaceholder={filter.searchPlaceholder}
            onSearch={filter.onSearch}
            aria-label={filter.label}
        />
    )
}

/**
 * One active filter, cleared by its ×.
 */
export function FilterChip({ label, onClear, className }) {
    return (
        <span className={cn('inline-flex h-6 max-w-64 items-center gap-1 rounded border border-zinc-300 bg-white pr-0.5 pl-2 text-[0.6875rem] text-zinc-700', className)}>
            <span className="truncate">{label}</span>
            <button type="button" onClick={onClear} aria-label={strings.clearFilter} className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                <X className="size-3" />
            </button>
        </span>
    )
}

function clearAllChanges(filters) {
    return Object.assign({}, ...filters.map(cleared))
}

/**
 * The filter definitions as a dropdown of labelled controls, with "clear all" when any is set.
 */
export function FilterMenu({ filters, values = {}, onChange, title = strings.filters, width = 'w-128 max-w-[calc(100vw-2rem)]' }) {
    const ranges = useOpenRanges(filters, values)
    const active = ranges.any || filters.some((filter) => isActive(filter, values))

    return (
        <Dropdown icon={SlidersHorizontal} title={title} active={active} align="right" width={width}>
            <div className="space-y-2 px-3 py-2">
                {filters.map((filter) => (
                    <div key={filter.key} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-2">
                        <span className="text-xs font-medium text-zinc-600">{filter.label}</span>
                        <div className="min-w-0">
                            <Control filter={filter} values={values} onChange={onChange} size="md" ranges={ranges} />
                        </div>
                    </div>
                ))}
                {active && (
                    <div className="flex justify-end border-t border-zinc-100 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                ranges.clear()
                                onChange(clearAllChanges(filters))
                            }}
                            className="text-[0.6875rem] text-zinc-500 hover:text-brand">
                            {strings.clearFilters}
                        </button>
                    </div>
                )}
            </div>
        </Dropdown>
    )
}

/**
 * `search` is either a node, drawn as given, or `{ value, onSearch?, placeholder?, key? }`, drawn as a `SearchInput`
 * that clear-all also empties (its query key, `search` by default, goes to `onChange`).
 */
function Search({ search, onChange, resets }) {
    if (!search || isValidElement(search)) {
        return search ?? null
    }

    const key = search.key ?? 'search'

    return (
        <SearchInput
            key={resets}
            value={search.value ?? ''}
            onSearch={search.onSearch ?? ((value) => onChange({ [key]: value || null }))}
            placeholder={search.placeholder}
            inputClassName={search.className ?? 'w-64'}
        />
    )
}

function searchChanges(search) {
    return search && !isValidElement(search) ? { [search.key ?? 'search']: null } : {}
}

function isSearching(search) {
    return Boolean(search && !isValidElement(search) && search.value)
}

function rowOf(filter) {
    return filter.row ?? (filter.type === 'dates' ? 'top' : 'main')
}

/**
 * One filter definition, two layouts. `filters` is a list of
 * `{ key, label, type: 'select' | 'buttons' | 'pills' | 'toggle' | 'dates' | 'custom', options?, multiple?, default?, row?, chip?, render? }`
 * (falsy entries are skipped, so a page can add one conditionally); `values` are the current values (TableQuery's
 * `filters`), and `onChange({ key: value, … })` gets the changes, `useTableQuery().setFilters` as it is.
 *
 * - `layout="bar"`: every filter shown above the table. Row 1 holds the `row: 'top'` filters (a `dates` filter goes
 *   there by default); row 2 starts with the search, then the other filters, then a clear-all icon while anything is
 *   set; `row: 'below'` filters make a third row.
 * - `layout="menu"`: a toolbar of `FilterChip`s for the active filters, the search, and a `FilterMenu` dropdown.
 *
 * Without `layout` it follows the panel's `->filterLayout()` (`tungsten.filter_layout`, `bar` by default). `start`
 * leads the toolbar in both (tabs, say).
 */
export function Filters({ filters, values = {}, onChange, layout, start, search, flush = false, className }) {
    const { panel } = usePage().props
    const [resets, setResets] = useState(0)
    const mode = layout ?? panel?.filterLayout ?? 'bar'
    const defined = filters.filter(Boolean)
    const ranges = useOpenRanges(defined, values)

    if (mode === 'menu') {
        const chips = chipsOf(defined, values)

        return (
            <TableToolbar
                flush={flush}
                className={className}
                start={
                    (start || chips.length > 0) && (
                        <>
                            {start}
                            {chips.map((chip) => (
                                <FilterChip key={chip.key} label={chip.label} onClear={() => onChange(chip.clear)} />
                            ))}
                        </>
                    )
                }
            >
                <Search search={search} onChange={onChange} resets={resets} />
                <FilterMenu filters={defined} values={values} onChange={onChange} />
            </TableToolbar>
        )
    }

    const row = (name) => defined.filter((filter) => rowOf(filter) === name)
    const active = ranges.any || isSearching(search) || defined.some((filter) => isActive(filter, values))
    const controls = (list) => list.map((filter) => <Control key={filter.key} filter={filter} values={values} onChange={onChange} size="sm" ranges={ranges} labelled />)
    const top = row('top')
    const below = row('below')

    function clearAll() {
        setResets((count) => count + 1)
        ranges.clear()
        onChange({ ...clearAllChanges(defined), ...searchChanges(search) })
    }

    return (
        <FilterBar
            flush={flush}
            className={className}
            top={(start || top.length > 0) && (
                <>
                    {start}
                    {top.map((filter) => <Control key={filter.key} filter={filter} values={values} onChange={onChange} size="sm" ranges={ranges} />)}
                </>
            )}
            below={below.length > 0 && controls(below)}
        >
            <Search search={search} onChange={onChange} resets={resets} />
            {controls(row('main'))}
            {active && <IconButton icon={FilterX} label={strings.clearFilters} onClick={clearAll} />}
        </FilterBar>
    )
}
