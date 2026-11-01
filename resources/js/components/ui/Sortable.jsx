import { GripVertical } from 'lucide-react'

import { cn } from '../../lib/cn'
import { useSortable } from '../../lib/useSortable'

/** The drag handle: a button, so it takes focus and the ↑ / ↓ keys. */
export function SortHandle({ className, ...props }) {
    return (
        <button
            {...props}
            className={cn(
                'inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:text-zinc-800 focus-visible:outline-2 focus-visible:outline-brand active:cursor-grabbing disabled:cursor-default disabled:opacity-40',
                className,
            )}
        >
            <GripVertical className="size-4" />
        </button>
    )
}

/**
 * A list reordered by dragging a row's handle (mouse, pen or touch) or by ↑ / ↓ on the focused handle. Rows move live
 * while dragging and the dragged one fades; `onReorder(items)` gets the new order once per drop and per key move.
 * `numbered` shows each row's position.
 */
export function Sortable({ items, keyOf = (item) => item.id, renderItem, onReorder, disabled = false, numbered = false, className }) {
    const sortable = useSortable({ items, keyOf, onReorder, disabled })

    return (
        <ol ref={sortable.container} className={cn('divide-y divide-zinc-100', className)}>
            {sortable.order.map((item, index) => (
                <li key={keyOf(item)} {...sortable.rowProps(item)} className="flex items-center gap-3 py-2 transition-opacity data-[dragging]:opacity-40">
                    <SortHandle {...sortable.handleProps(item, index)} />
                    {numbered && <span className="w-6 shrink-0 text-right text-[0.75rem] text-zinc-400 tabular-nums">{index + 1}</span>}
                    <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
                </li>
            ))}
        </ol>
    )
}
