import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Select } from './form'
import { cn } from '../../lib/cn'
import { number } from '../../lib/format'
import { strings } from '../../lib/strings'

function pages(current, last) {
    const shown = [...new Set([1, current - 1, current, current + 1, last])].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b)

    return shown.flatMap((page, index) => (index > 0 && page - shown[index - 1] > 1 ? ['…', page] : [page]))
}

function PerPage({ value, options, onChange }) {
    return (
        <Select size="sm" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={strings.rowsPerPage}>
            {options.map((option) => (
                <option key={option} value={option}>
                    {strings.perPage(option)}
                </option>
            ))}
        </Select>
    )
}

/**
 * The range and page buttons under a table. With `onPerPage` it adds a per-page picker (`perPageOptions`, 25/50/100
 * by default; the server must allow the same values: `TableQuery::perPage(25, [25, 50, 100])`).
 */
export function Pagination({ paginator, onPage, onPerPage, perPageOptions = [25, 50, 100], flush = false }) {
    const { current_page: current, last_page: last, total, from, to } = paginator
    const button = 'inline-flex h-6 min-w-6 items-center justify-center rounded border px-1.5 tabular-nums'

    return (
        <div className={cn('flex items-center justify-between gap-2 border-t border-zinc-100 py-1.5 text-[0.6875rem] text-zinc-500', flush ? 'px-0' : 'px-2.5')}>
            <span className="flex items-center gap-2">
                {onPerPage && <PerPage value={paginator.per_page} options={perPageOptions} onChange={onPerPage} />}
                <span className="tabular-nums">{total === 0 ? strings.noItems : strings.paginationRange(number(from), number(to), number(total))}</span>
            </span>
            {last > 1 && (
                <span className="flex items-center gap-1">
                    <button
                        type="button"
                        className={cn(button, 'border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40')}
                        disabled={current <= 1}
                        onClick={() => onPage(current - 1)}
                        aria-label={strings.previousPage}
                    >
                        <ChevronLeft className="size-3.5" />
                    </button>
                    {pages(current, last).map((page, index) =>
                        page === '…' ? (
                            <span key={`gap-${index}`} className="px-0.5">
                                …
                            </span>
                        ) : (
                            <button
                                key={page}
                                type="button"
                                onClick={() => onPage(page)}
                                aria-current={page === current ? 'page' : undefined}
                                className={cn(button, page === current ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-300 bg-white hover:bg-zinc-100')}
                            >
                                {page}
                            </button>
                        ),
                    )}
                    <button
                        type="button"
                        className={cn(button, 'border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40')}
                        disabled={current >= last}
                        onClick={() => onPage(current + 1)}
                        aria-label={strings.nextPage}
                    >
                        <ChevronRight className="size-3.5" />
                    </button>
                </span>
            )}
        </div>
    )
}
