import { cn } from '../../lib/cn'

/**
 * The filter row above a table, always shown (no toggle): presets (`ButtonGroup size="sm"` or `Pills`), inline
 * `Combobox size="sm"` / `Select size="sm"` filters and, in `end`, the `SearchInput`. `below` is an optional second
 * row (a sub-status row on one tab). `flush` lines it up with a `DataTable flush`.
 */
export function FilterBar({ children, end, below, flush = false, className }) {
    const padding = flush ? 'px-0' : 'px-2.5'

    return (
        <div className={cn('border-b border-zinc-100 py-1.5', padding, className)}>
            <div className="flex flex-wrap items-center gap-2">
                {children}
                {end && <div className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">{end}</div>}
            </div>
            {below && <div className="mt-1.5 flex flex-wrap items-center gap-2">{below}</div>}
        </div>
    )
}

/**
 * A label before a filter control, for a control that doesn't carry its own (`Combobox` takes `label` instead).
 */
export function FilterField({ label, children, className }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[0.6875rem] text-zinc-500', className)}>
            {label}
            {children}
        </span>
    )
}
