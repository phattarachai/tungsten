import { Link } from '@inertiajs/react'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { Fragment, useState } from 'react'

import { cn } from '../../lib/cn'
import { nextSort, sortRows } from '../../lib/sortRows'

import { firstAction, KeyAction, RowActions } from './RowActions'
import { strings } from '../../lib/strings'

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

const STICKY = 'sticky left-0'

function keyOf(row, rowKey, index) {
    if (typeof rowKey === 'function') {
        return rowKey(row, index)
    }

    return row[rowKey] ?? index
}

function Cell({ column, row, href, action }) {
    const value = column.render ? column.render(row) : row[column.key]
    const title = column.truncate && typeof row[column.key] === 'string' ? row[column.key] : undefined

    return (
        <td
            className={cn(
                'h-7 px-2 py-0.5',
                ALIGN[column.align ?? 'left'],
                column.truncate ? 'max-w-96 truncate' : 'whitespace-nowrap',
                column.className,
                column.primary && 'font-medium text-brand tabular-nums',
                column.sticky && cn(STICKY, 'z-[1] bg-white group-hover/row:bg-zinc-50'),
            )}
            title={title}
        >
            {href ? (
                <Link href={href} prefetch="click" className="hover:text-brand-600 hover:underline">
                    {value}
                </Link>
            ) : (
                <KeyAction action={action}>{value}</KeyAction>
            )}
        </td>
    )
}

function Row({ row, columns, rowHref, rowActions, rowClassName }) {
    const href = rowHref?.(row)
    const action = href ? null : firstAction(rowActions?.(row))
    const primaryIndex = columns.findIndex((column) => column.primary)
    const linkIndex = primaryIndex >= 0 ? primaryIndex : columns.findIndex((column) => column.key !== '__select' && column.key !== '__actions')

    return (
        <tr className={cn('group/row border-b border-zinc-100 last:border-0 hover:bg-zinc-50', rowClassName?.(row))}>
            {columns.map((column, columnIndex) => (
                <Cell key={column.key} column={column} row={row} href={columnIndex === linkIndex ? href : undefined} action={columnIndex === linkIndex ? action : undefined} />
            ))}
        </tr>
    )
}

function GroupRow({ group, columns }) {
    const className = 'h-6 border-b border-zinc-200 bg-zinc-50 px-2 text-[0.6875rem] font-semibold whitespace-nowrap text-zinc-600'
    const label = (
        <>
            {group.label}
            {group.hint && <span className="ml-1.5 font-normal text-zinc-400">{group.hint}</span>}
        </>
    )

    if (!group.summary) {
        return (
            <tr>
                <td colSpan={columns.length} className={className}>
                    {label}
                </td>
            </tr>
        )
    }

    return (
        <tr>
            {columns.map((column, index) => (
                <td key={column.key} className={cn(className, ALIGN[column.align ?? 'left'])}>
                    {index === 0 ? label : group.summary[column.key]}
                </td>
            ))}
        </tr>
    )
}

function SortIcon({ dir }) {
    const Icon = { asc: ChevronUp, desc: ChevronDown }[dir] ?? ChevronsUpDown

    return <Icon className={cn('size-3 shrink-0', dir ? 'text-zinc-700' : 'text-zinc-300 group-hover/sort:text-zinc-400')} />
}

function HeaderCell({ column, sort, onSort }) {
    const dir = sort?.key === column.key ? sort.dir : undefined
    const className = cn(
        'sticky top-0 border-b border-zinc-200 bg-white px-2 py-1 text-[0.625rem] font-medium whitespace-nowrap text-zinc-500',
        ALIGN[column.align ?? 'left'],
        column.sticky && cn(STICKY, 'z-[2]'),
    )

    if (!column.sortable) {
        return <th className={className}>{column.label}</th>
    }

    return (
        <th className={className} aria-sort={{ asc: 'ascending', desc: 'descending' }[dir] ?? 'none'}>
            <button
                type="button"
                onClick={() => onSort(column)}
                className={cn('group/sort inline-flex items-center gap-0.5 hover:text-zinc-800', column.align === 'right' && 'flex-row-reverse', dir && 'text-zinc-800')}
            >
                {column.label}
                <SortIcon dir={dir} />
            </button>
        </th>
    )
}

function selectColumn(rows, keyFor, selection, onSelectionChange) {
    const keys = rows.map(keyFor)
    const allSelected = keys.length > 0 && keys.every((key) => selection.includes(key))

    function toggle(key) {
        onSelectionChange(selection.includes(key) ? selection.filter((value) => value !== key) : [...selection, key])
    }

    return {
        key: '__select',
        label: <input type="checkbox" checked={allSelected} onChange={() => onSelectionChange(allSelected ? [] : keys)} aria-label={strings.selectAll} className="align-middle accent-brand" />,
        className: 'w-6',
        render: (row) => <input type="checkbox" checked={selection.includes(keyFor(row))} onChange={() => toggle(keyFor(row))} aria-label={strings.selectRow} className="align-middle accent-brand" />,
    }
}

function actionsColumn(rowActions, rowActionsTitle, atStart) {
    return {
        key: '__actions',
        label: '',
        align: atStart ? 'left' : 'right',
        className: 'w-8',
        sticky: atStart,
        render: (row) => <RowActions items={rowActions(row)} title={rowActionsTitle?.(row)} />,
    }
}

function withActions(columns, rowActions, rowActionsTitle, actionsPosition) {
    if (!rowActions) {
        return columns
    }

    const column = actionsColumn(rowActions, rowActionsTitle, actionsPosition === 'start')

    return actionsPosition === 'start' ? [column, ...columns] : [...columns, column]
}

function withSelect(columns, column, actionsPosition) {
    return actionsPosition === 'start' && columns[0]?.key === '__actions' ? [columns[0], column, ...columns.slice(1)] : [column, ...columns]
}

export function DataTable({
    columns: baseColumns,
    rows = [],
    groups,
    rowKey = 'id',
    rowHref,
    rowActions,
    rowActionsTitle,
    actionsPosition = 'end',
    rowClassName: baseRowClassName,
    empty = strings.noData,
    flush = false,
    className,
    sort,
    onSort,
    defaultSort = null,
    selection,
    onSelectionChange,
}) {
    const selectable = selection !== undefined && onSelectionChange !== undefined
    const allRows = groups ? groups.flatMap((group) => group.rows) : rows
    const keyFor = (row) => keyOf(row, rowKey, allRows.indexOf(row))
    const actionColumns = withActions(baseColumns, rowActions, rowActionsTitle, actionsPosition)
    const columns = selectable ? withSelect(actionColumns, selectColumn(allRows, keyFor, selection, onSelectionChange), actionsPosition) : actionColumns
    const rowClassName = selectable ? (row) => cn(selection.includes(keyFor(row)) && 'bg-zinc-100', baseRowClassName?.(row)) : baseRowClassName
    const [localSort, setLocalSort] = useState(defaultSort)
    const controlled = onSort !== undefined
    const activeSort = controlled ? sort : localSort
    const sortColumn = controlled ? null : columns.find((column) => column.sortable && column.key === activeSort?.key)
    const ordered = (list) => (sortColumn ? sortRows(list, sortColumn, activeSort.dir) : list)
    const rowProps = { columns, rowKey, rowHref, rowActions, rowClassName }
    const isEmpty = groups ? groups.every((group) => group.rows.length === 0) : rows.length === 0

    function changeSort(column) {
        const next = nextSort(activeSort, column)

        if (controlled) {
            onSort(next.key, next.dir)

            return
        }

        setLocalSort(next)
    }

    return (
        <div className={cn('overflow-x-auto overflow-y-hidden', !flush && 'rounded border border-zinc-200 bg-white', className)}>
            <table className="w-full border-collapse text-xs tabular-nums">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <HeaderCell key={column.key} column={column} sort={activeSort} onSort={changeSort} />
                        ))}
                    </tr>
                </thead>
                <tbody className="text-zinc-800">
                    {isEmpty && (
                        <tr>
                            <td colSpan={columns.length} className="px-2 py-6 text-center text-zinc-400">
                                {empty}
                            </td>
                        </tr>
                    )}
                    {groups
                        ? groups
                              .filter((group) => group.rows.length > 0)
                              .map((group) => (
                                  <Fragment key={group.key}>
                                      <GroupRow group={group} columns={columns} />
                                      {ordered(group.rows).map((row, index) => (
                                          <Row key={keyOf(row, rowKey, index)} row={row} index={index} {...rowProps} />
                                      ))}
                                  </Fragment>
                              ))
                        : ordered(rows).map((row, index) => <Row key={keyOf(row, rowKey, index)} row={row} index={index} {...rowProps} />)}
                </tbody>
            </table>
        </div>
    )
}
