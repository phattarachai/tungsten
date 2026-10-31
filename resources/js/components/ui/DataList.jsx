import { cn } from '../../lib/cn'

import { firstAction, RowActions } from './RowActions'
import { strings } from '../../lib/strings'

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

function keyOf(row, rowKey, index) {
    return typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? index)
}

function MetaLine({ items, className }) {
    const shown = items.filter((item) => item !== null && item !== undefined && item !== false && item !== '')

    if (shown.length === 0) {
        return null
    }

    return (
        <div className={cn("flex flex-wrap items-center text-[0.6875rem] text-zinc-500 tabular-nums [&>*+*]:before:mx-1.5 [&>*+*]:before:text-zinc-300 [&>*+*]:before:content-['·']", className)}>
            {shown.map((item, index) => (
                <span key={index}>{item}</span>
            ))}
        </div>
    )
}

function columnValue(column, row) {
    return column.render ? column.render(row) : row[column.key]
}

function inlineColumn(column, row) {
    const value = columnValue(column, row)

    if (value === null || value === undefined || value === '') {
        return null
    }

    return column.inlineLabel === false ? (
        value
    ) : (
        <>
            {column.label} {value}
        </>
    )
}

export function DataList({ rows = [], rowKey = 'id', lead, title, subtitle, meta, columns = [], actions, label, rowClassName, empty = strings.noData, className }) {
    if (rows.length === 0) {
        return <p className="px-3 py-6 text-center text-xs text-zinc-400">{empty}</p>
    }

    return (
        <div className={cn('@container', className)}>
            {(columns.length > 0 || lead) && (
                <div className="hidden items-center gap-3 border-b border-zinc-200 bg-white px-3 py-1 text-[0.625rem] font-medium text-zinc-500 @2xl:flex">
                    {lead && <span className={cn('shrink-0', lead.width)}>{lead.label}</span>}
                    <span className="min-w-0 flex-1">{label}</span>
                    {columns.map((column) => (
                        <span key={column.key} className={cn('shrink-0', column.width, ALIGN[column.align ?? 'left'])}>
                            {column.label}
                        </span>
                    ))}
                    {actions && <span className="w-6 shrink-0" />}
                </div>
            )}
            <ul>
                {rows.map((row, index) => {
                    const items = actions?.(row) ?? []
                    const action = firstAction(items)
                    const leadValue = lead?.render(row, action)

                    return (
                        <li key={keyOf(row, rowKey, index)} className={cn('flex items-start gap-3 border-b border-zinc-100 px-3 py-1.5 last:border-0 hover:bg-zinc-50', rowClassName?.(row))}>
                            {lead && <div className={cn('hidden shrink-0 text-[0.78125rem] @2xl:block', lead.width)}>{leadValue ?? <span className="text-zinc-300">—</span>}</div>}
                            <div className="min-w-0 flex-1 space-y-px">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.78125rem] text-zinc-900">
                                    {leadValue && <span className="@2xl:hidden">{leadValue}</span>}
                                    {title(row, action)}
                                </div>
                                {subtitle && <div className="text-xs text-zinc-600">{subtitle(row)}</div>}
                                <MetaLine className="@2xl:hidden" items={[...columns.map((column) => inlineColumn(column, row)), ...(meta?.(row) ?? [])]} />
                                <MetaLine className="hidden @2xl:flex" items={meta?.(row) ?? []} />
                            </div>
                            {columns.map((column) => (
                                <div key={column.key} className={cn('hidden shrink-0 pt-px text-xs text-zinc-700 tabular-nums @2xl:block', column.width, ALIGN[column.align ?? 'left'])}>
                                    {columnValue(column, row) ?? <span className="text-zinc-300">—</span>}
                                </div>
                            ))}
                            {actions && (
                                <span className="w-6 shrink-0">
                                    <RowActions items={items} />
                                </span>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
