import { cn } from '../../lib/cn'

/**
 * The filter row above a table, always shown (no toggle): presets (`ButtonGroup size="sm"` or `Pills`), inline
 * `Combobox size="sm"` / `Select size="sm"` filters, the `SearchInput`. `top` is an optional row above (date presets),
 * `end` sits at the right of the main row, `below` is an optional row under it. `flush` lines it up with a
 * `DataTable flush`.
 */
export function FilterBar({ top, children, end, below, flush = false, className }) {
    const padding = flush ? 'px-0' : 'px-2.5'

    return (
        <div className={cn('space-y-1.5 border-b border-zinc-100 py-1.5', padding, className)}>
            {top && <div className="flex flex-wrap items-center gap-2">{top}</div>}
            <div className="flex flex-wrap items-center gap-2">
                {children}
                {end && <div className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">{end}</div>}
            </div>
            {below && <div className="flex flex-wrap items-center gap-2">{below}</div>}
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
