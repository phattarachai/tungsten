import { usePage } from '@inertiajs/react'
import { SlidersHorizontal, X } from 'lucide-react'

import { ButtonGroup } from './ButtonGroup'
import { Combobox } from './Combobox'
import { Dropdown } from './Dropdown'
import { FilterBar } from './FilterBar'
import { Pills } from './Pills'
import { Switch } from './Switch'
import { TableToolbar } from './TableToolbar'
import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'

function isEmpty(value) {
    return value === null || value === undefined || value === '' || value === false || (Array.isArray(value) && value.length === 0)
}

function isActive(filter, value) {
    if (filter.type === 'toggle') {
        return !isEmpty(value) && value !== '0' && value !== 0
    }

    return !isEmpty(value) && String(value) !== String(filter.default ?? '')
}

function labelOf(filter, value) {
    return filter.options?.find((option) => String(option.value) === String(value))?.label ?? String(value)
}

/**
 * The active filters as chips: one per value of a multiple filter, each with the change that clears it.
 */
function chipsOf(filters, values) {
    return filters.flatMap((filter) => {
        const value = values[filter.key]

        if (!isActive(filter, value)) {
            return []
        }

        if (filter.chip) {
            return [{ key: filter.key, label: filter.chip(value), clear: { [filter.key]: null } }]
        }

        if (filter.type === 'toggle') {
            return [{ key: filter.key, label: filter.label, clear: { [filter.key]: null } }]
        }

        if (Array.isArray(value)) {
            return value.map((entry) => ({
                key: `${filter.key}-${entry}`,
                label: `${filter.label}: ${labelOf(filter, entry)}`,
                clear: { [filter.key]: value.filter((current) => current !== entry) },
            }))
        }

        return [{ key: filter.key, label: `${filter.label}: ${labelOf(filter, value)}`, clear: { [filter.key]: null } }]
    })
}

function Control({ filter, value, onChange, size }) {
    const set = (next) => onChange({ [filter.key]: isEmpty(next) ? null : next })

    if (filter.type === 'custom') {
        return filter.render({ value, onChange: set, size })
    }

    if (filter.type === 'buttons') {
        return <ButtonGroup size="sm" options={filter.options} value={value ?? filter.default ?? ''} onChange={set} />
    }

    if (filter.type === 'pills') {
        return <Pills options={filter.options} value={value ?? filter.default ?? ''} onChange={set} />
    }

    if (filter.type === 'toggle') {
        return (
            <label className="inline-flex items-center gap-1.5 text-[0.6875rem] text-zinc-600">
                <Switch checked={isActive(filter, value)} onChange={(on) => set(on ? 1 : null)} label={filter.label} />
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

/**
 * The filter definitions as a dropdown of labelled controls, with "clear all" when any is set.
 */
export function FilterMenu({ filters, values = {}, onChange, title = strings.filters, width = 'w-128 max-w-[calc(100vw-2rem)]' }) {
    const active = filters.some((filter) => isActive(filter, values[filter.key]))

    return (
        <Dropdown icon={SlidersHorizontal} title={title} active={active} align="right" width={width}>
            <div className="space-y-2 px-3 py-2">
                {filters.map((filter) => (
                    <div key={filter.key} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-2">
                        <span className="text-xs font-medium text-zinc-600">{filter.label}</span>
                        <div className="min-w-0">
                            <Control filter={filter} value={values[filter.key]} onChange={onChange} size="md" />
                        </div>
                    </div>
                ))}
                {active && (
                    <div className="flex justify-end border-t border-zinc-100 pt-2">
                        <ClearAll filters={filters} onChange={onChange} />
                    </div>
                )}
            </div>
        </Dropdown>
    )
}

function ClearAll({ filters, onChange }) {
    return (
        <button type="button" onClick={() => onChange(Object.fromEntries(filters.map((filter) => [filter.key, null])))} className="text-[0.6875rem] text-zinc-500 hover:text-brand">
            {strings.clearFilters}
        </button>
    )
}

/**
 * One filter definition, two layouts. `filters` is a list of
 * `{ key, label, type: 'select' | 'buttons' | 'pills' | 'toggle' | 'custom', options?, multiple?, default?, row?, chip?, render? }`
 * (falsy entries are skipped, so a page can add one conditionally); `values` are the current values (TableQuery's
 * `filters`), and `onChange({ key: value, … })` gets the changes, `useTableQuery().setFilters` as it is.
 *
 * - `layout="bar"`: every filter shown above the table in a `FilterBar`; `row: 'below'` puts one in the second row.
 * - `layout="menu"`: a toolbar of `FilterChip`s for the active filters and a `FilterMenu` dropdown holding them.
 *
 * Without `layout` it follows the panel's `->filterLayout()` (`tungsten.filter_layout`, `bar` by default). `start`
 * leads the row in both (tabs, say), `search` ends it.
 */
export function Filters({ filters, values = {}, onChange, layout, start, search, flush = false, className }) {
    const { panel } = usePage().props
    const mode = layout ?? panel?.filterLayout ?? 'bar'
    const defined = filters.filter(Boolean)
    const chips = chipsOf(defined, values)

    if (mode === 'menu') {
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
                {search}
                <FilterMenu filters={defined} values={values} onChange={onChange} />
            </TableToolbar>
        )
    }

    const below = defined.filter((filter) => filter.row === 'below')

    return (
        <FilterBar
            flush={flush}
            className={className}
            end={search}
            below={below.length > 0 && below.map((filter) => <Control key={filter.key} filter={filter} value={values[filter.key]} onChange={onChange} size="sm" />)}
        >
            {start}
            {defined
                .filter((filter) => filter.row !== 'below')
                .map((filter) => (
                    <Control key={filter.key} filter={filter} value={values[filter.key]} onChange={onChange} size="sm" />
                ))}
            {chips.length > 0 && <ClearAll filters={defined} onChange={onChange} />}
        </FilterBar>
    )
}
