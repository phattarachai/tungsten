import { Link } from '@inertiajs/react'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { Fragment, useState } from 'react'

import { cn } from '../../lib/cn'
import { usePageWidth } from '../../lib/pageWidth'
import { nextSort, sortRows } from '../../lib/sortRows'

import { firstAction, KeyAction, RowActions } from './RowActions'
import { SortHandle } from './Sortable'
import { useSortable } from '../../lib/useSortable'
import { strings } from '../../lib/strings'
import { linkProps, methodOf, urlOf } from '../../lib/href'

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

const VALIGN = { top: 'align-top', middle: 'align-middle', bottom: 'align-bottom' }

const STICKY = 'sticky left-0'

function keyOf(row, rowKey, index) {
    if (typeof rowKey === 'function') {
        return rowKey(row, index)
    }

    return row[rowKey] ?? index
}

const WRAP = 'w-72'

/** A `wrap` column's content: wraps to two lines at its width (`wrap: 'w-96'`, or `true` for w-72), the rest in a tooltip. */
function Wrapped({ wrap, title, children }) {
    return (
        <div className={cn('line-clamp-2 whitespace-normal', typeof wrap === 'string' ? wrap : WRAP)} title={title}>
            {children}
        </div>
    )
}

function Cell({ column, row, href, action, valign, plainLinks }) {
    const raw = column.render ? column.render(row) : row[column.key]
    const text = typeof row[column.key] === 'string' ? row[column.key] : undefined
    const title = column.truncate ? text : undefined
    const value = column.wrap ? <Wrapped wrap={column.wrap} title={text}>{raw}</Wrapped> : raw

    return (
        <td
            className={cn(
                'h-7 px-2 py-0.5',
                ALIGN[column.align ?? 'left'],
                VALIGN[column.valign ?? valign],
                column.truncate ? 'max-w-96 truncate' : 'whitespace-nowrap',
                column.className,
                column.primary && 'font-medium text-brand tabular-nums',
                column.sticky && cn(STICKY, 'z-[1] bg-white group-hover/row:bg-zinc-50'),
            )}
            title={title}
        >
            {href && plainLinks ? (
                <a href={urlOf(href)} className="hover:text-brand-600 hover:underline">
                    {value}
                </a>
            ) : href ? (
                <Link {...linkProps(href)} prefetch={methodOf(href) === 'get' ? 'click' : false} className="hover:text-brand-600 hover:underline">
                    {value}
                </Link>
            ) : (
                <KeyAction action={action}>{value}</KeyAction>
            )}
        </td>
    )
}

/**
 * One of a row's sub-lines (`subRows`): each column draws its `sub(line, row)`, so the lines align across columns.
 */
function SubRow({ line, row, columns, last, sortableProps }) {
    return (
        <tr {...sortableProps} className={cn('text-[0.75rem] text-zinc-600 transition-opacity data-[dragging]:opacity-40', last ? 'border-b border-zinc-100 last:border-0' : 'border-0')}>
            {columns.map((column) => (
                <td key={column.key} className={cn('h-6 px-2 pb-1 whitespace-nowrap', ALIGN[column.align ?? 'left'], column.subClassName)}>
                    {column.sub?.(line, row) ?? null}
                </td>
            ))}
        </tr>
    )
}

function Row({ row, columns, rowHref, rowActions, rowClassName, valign, plainLinks, sortableProps, subRows }) {
    const href = rowHref?.(row)
    const action = href ? null : firstAction(rowActions?.(row))
    const primaryIndex = columns.findIndex((column) => column.primary)
    const linkIndex = primaryIndex >= 0 ? primaryIndex : columns.findIndex((column) => !['__select', '__actions', '__reorder'].includes(column.key))
    const lines = subRows?.(row) ?? []

    return (
        <>
            <tr
                {...sortableProps}
                className={cn('group/row transition-opacity hover:bg-zinc-50 data-[dragging]:opacity-40', lines.length > 0 ? 'border-0' : 'border-b border-zinc-100 last:border-0', rowClassName?.(row))}
            >
                {columns.map((column, columnIndex) => (
                    <Cell key={column.key} column={column} row={row} valign={valign} plainLinks={plainLinks} href={columnIndex === linkIndex ? href : undefined} action={columnIndex === linkIndex ? action : undefined} />
                ))}
            </tr>
            {lines.map((line, index) => (
                <SubRow key={line.key ?? line.id ?? index} line={line} row={row} columns={columns} last={index === lines.length - 1} sortableProps={sortableProps} />
            ))}
        </>
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

/** Reorder mode's first column: each row's drag handle. */
function withReorder(columns, sortable) {
    const handle = {
        key: '__reorder',
        label: '',
        className: 'w-8 pr-0',
        render: (row) => <SortHandle {...sortable.handleProps(row, sortable.order.indexOf(row))} />,
    }

    return [handle, ...columns]
}

/** A fitted table's columns without `w-full`, the class a spacer column uses to take the spare room. */
function withoutSpacer(columns) {
    return columns.map((column) => (/(?:^|\s)w-full(?:\s|$)/.test(column.className ?? '') ? { ...column, className: column.className.split(/\s+/).filter((name) => name !== 'w-full').join(' ') } : column))
}

function withSelect(columns, column, actionsPosition) {
    return actionsPosition === 'start' && columns[0]?.key === '__actions' ? [columns[0], column, ...columns.slice(1)] : [column, ...columns]
}

/**
 * A column is `{ key, label, render?, sub?, align?, valign?, sortable?, primary?, truncate?, wrap?, sticky?, className? }`;
 * `valign: 'top'` (or the table's `valign`) top-aligns a column of multi-line cells. `rowHref(row)` links the primary
 * cell with an Inertia `<Link>`, or a plain `<a>` with `plainLinks` (rows that open non-Inertia pages).
 * A column's `wrap` (`true`, or a width such as `'w-96'`; w-72 by default) lets a long value wrap to two lines at that
 * width, the full text in its tooltip.
 * `subRows(row)` lists a row's sub-lines (a product's variants): each line is drawn under the row as its own table
 * row, where every column draws `sub(line, row)` (or nothing), so the lines line up across columns.
 * `reorderable={{ onReorder, disabled? }}` adds a drag handle to each row (mouse, pen, touch, or ↑ / ↓ on the handle)
 * and calls `onReorder(rows)` with the new order per drop; sorting is off meanwhile. Switch it on behind the page's
 * "จัดลำดับ" toggle, with paging and search off, so every row is there to reorder.
 * `fit` sizes the table to its columns instead of the full width. Either way, and on a page with `width: 'fit'`, a
 * column's `w-full` (a trailing spacer that takes the spare room) is dropped, so it can't stretch the table; on such a
 * page the table still fills its box, which is already as wide as its content.
 */
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
    valign,
    plainLinks = false,
    className,
    sort,
    onSort,
    defaultSort = null,
    selection,
    onSelectionChange,
    reorderable,
    subRows,
    fit = false,
}) {
    const pageWidth = usePageWidth()
    const fitted = fit || pageWidth === 'fit'
    const selectable = selection !== undefined && onSelectionChange !== undefined
    const allRows = groups ? groups.flatMap((group) => group.rows) : rows
    const keyFor = (row) => keyOf(row, rowKey, allRows.indexOf(row))
    const sortable = useSortable({
        items: rows,
        keyOf: (row) => keyOf(row, rowKey, rows.indexOf(row)),
        onReorder: (next) => reorderable?.onReorder(next),
        disabled: !reorderable || Boolean(reorderable.disabled),
    })
    const actionColumns = withActions(fitted ? withoutSpacer(baseColumns) : baseColumns, rowActions, rowActionsTitle, actionsPosition)
    const pickedColumns = selectable ? withSelect(actionColumns, selectColumn(allRows, keyFor, selection, onSelectionChange), actionsPosition) : actionColumns
    const columns = reorderable ? withReorder(pickedColumns, sortable) : pickedColumns
    const rowClassName = selectable ? (row) => cn(selection.includes(keyFor(row)) && 'bg-zinc-100', baseRowClassName?.(row)) : baseRowClassName
    const [localSort, setLocalSort] = useState(defaultSort)
    const controlled = onSort !== undefined
    const activeSort = controlled ? sort : localSort
    const sortColumn = controlled ? null : columns.find((column) => column.sortable && column.key === activeSort?.key)
    const ordered = (list) => (sortColumn ? sortRows(list, sortColumn, activeSort.dir) : list)
    const rowProps = { columns, rowKey, rowHref, rowActions, rowClassName, valign, plainLinks, subRows }
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
        <div className={cn('overflow-x-auto overflow-y-hidden', fit && 'w-fit max-w-full', !flush && 'rounded border border-zinc-200 bg-white', className)}>
            <table className={cn('border-collapse text-xs tabular-nums', !fit && 'w-full')}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <HeaderCell key={column.key} column={reorderable ? { ...column, sortable: false } : column} sort={activeSort} onSort={changeSort} />
                        ))}
                    </tr>
                </thead>
                <tbody ref={reorderable ? sortable.container : undefined} className="text-zinc-800">
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
                        : reorderable
                          ? sortable.order.map((row, index) => <Row key={keyOf(row, rowKey, index)} row={row} index={index} sortableProps={sortable.rowProps(row)} {...rowProps} />)
                          : ordered(rows).map((row, index) => <Row key={keyOf(row, rowKey, index)} row={row} index={index} {...rowProps} />)}
                </tbody>
            </table>
        </div>
    )
}
