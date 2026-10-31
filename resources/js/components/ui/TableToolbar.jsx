import { cn } from '../../lib/cn'

export function TableToolbar({ start, children, className }) {
    return (
        <div className={cn('flex flex-wrap items-center gap-2 border-b border-zinc-100 px-2.5 py-1.5', className)}>
            {start}
            {children && <div className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">{children}</div>}
        </div>
    )
}
