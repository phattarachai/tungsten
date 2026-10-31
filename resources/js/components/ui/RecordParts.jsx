import { cn } from '../../lib/cn'

/*
 | The record page's plain parts (README → "Record pages"): one sheet, no Section inside a Section, text headings, a
 | hairline between blocks, label–value facts with no boxes, widths by container (`@container`, `@2xl:`), not viewport.
 */

/** A block's plain-text heading; `actions` (icon buttons, a ⋯ ActionMenu) sit at its right. */
export function Heading({ children, actions, className }) {
    return (
        <div className={cn('mb-2 flex min-h-6 items-center gap-2', className)}>
            <h2 className="text-xs font-semibold text-zinc-800">{children}</h2>
            {actions && <span className="ml-auto flex items-center gap-1">{actions}</span>}
        </div>
    )
}

/** The hairline between blocks. */
export function Rule({ className }) {
    return <div className={cn('my-4 h-px bg-zinc-100', className)} />
}

/**
 * Label–value rows with no lines or boxes; a falsy row is skipped, an empty value shows a grey dash. (`DetailList` is
 * the boxed version, for inside a Section.)
 */
export function Facts({ rows, labelWidth = '7.5rem', className }) {
    return (
        <dl className={cn('grid gap-x-3 gap-y-1.5', className)} style={{ gridTemplateColumns: `${labelWidth} minmax(0,1fr)` }}>
            {rows.filter(Boolean).map((row) => (
                <div key={row.label} className="contents">
                    <dt className="text-zinc-500">{row.label}</dt>
                    <dd className="min-w-0 break-words text-zinc-900">{row.value ?? <span className="text-zinc-300">—</span>}</dd>
                </div>
            ))}
        </dl>
    )
}
