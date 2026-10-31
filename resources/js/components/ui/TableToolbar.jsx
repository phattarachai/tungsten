import { cn } from '../../lib/cn'

/**
 * `flush` drops the side padding so the toolbar lines up with a `DataTable flush` (a table on a sheet or a bare page).
 */
export function TableToolbar({ start, children, flush = false, className }) {
    return (
        <div className={cn('flex flex-wrap items-center gap-2 border-b border-zinc-100 py-1.5', flush ? 'px-0' : 'px-2.5', className)}>
            {start}
            {children && <div className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">{children}</div>}
        </div>
    )
}
