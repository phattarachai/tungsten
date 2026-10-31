import { ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment } from 'react'

import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }
const INDENT_REM = 1.25
const CARET_REM = 1.375

function indent(depth, extra = 0) {
    return { paddingLeft: `${depth * INDENT_REM + extra + 0.5}rem` }
}

function GroupRow({ node, columns, depth, collapsed, onToggle }) {
    return (
        <tr>
            <td
                colSpan={columns.length}
                className="h-6 border-b border-zinc-200 bg-zinc-50 px-2 text-[0.6875rem] font-semibold whitespace-nowrap text-zinc-600"
                style={indent(depth)}
            >
                <button type="button" onClick={() => onToggle(node.id)} aria-expanded={!collapsed} className="inline-flex items-center gap-1 hover:text-zinc-900">
                    {collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
                    {node.label}
                </button>
                {node.meta && <span className="ml-1.5 font-normal text-zinc-400">{node.meta}</span>}
            </td>
        </tr>
    )
}

function Caret({ node, collapsed, onToggle }) {
    return (
        <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? strings.expand : strings.collapse}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
    )
}

/**
 * A branch row whose figures line up under the columns: the label spans the first `span` columns, `cells` fill the rest.
 */
function CellsRow({ node, columns, depth, caret, className }) {
    const span = node.span ?? 1

    return (
        <tr className={className}>
            <td colSpan={span} className="h-8 px-2 py-0.5" style={indent(depth)}>
                <div className="flex items-center gap-1">
                    {caret}
                    <div className="min-w-0 flex-1">{node.label}</div>
                </div>
            </td>
            {columns.slice(span).map((column) => (
                <td key={column.key} className={cn('px-2 py-0.5', ALIGN[column.align ?? 'left'], column.className)}>
                    {node.cells[column.key]}
                </td>
            ))}
        </tr>
    )
}

function BranchRow({ node, columns, depth, collapsed, onToggle }) {
    if (node.cells) {
        return (
            <CellsRow
                node={node}
                columns={columns}
                depth={depth}
                caret={<Caret node={node} collapsed={collapsed} onToggle={onToggle} />}
                className="border-b border-zinc-100 bg-white"
            />
        )
    }

    return (
        <tr onContextMenu={node.onContextMenu} className="border-b border-zinc-100 bg-white">
            <td colSpan={columns.length} className="h-8 px-2 py-0.5" style={indent(depth)}>
                <div className="flex items-center gap-1">
                    <Caret node={node} collapsed={collapsed} onToggle={onToggle} />
                    <div className="min-w-0 flex-1">{node.label}</div>
                    {node.meta && <div className="shrink-0 text-[0.6875rem] text-zinc-500 tabular-nums">{node.meta}</div>}
                </div>
            </td>
        </tr>
    )
}

function LeafRow({ node, columns, depth }) {
    return (
        <tr
            onClick={node.onSelect}
            onContextMenu={node.onContextMenu}
            aria-selected={node.selected || undefined}
            className={cn(
                'border-b border-zinc-100 align-top last:border-0',
                node.onSelect && 'cursor-pointer hover:bg-zinc-50',
                node.selected && 'bg-zinc-50 shadow-[inset_2px_0_0_var(--color-brand)]',
            )}
        >
            {columns.map((column, index) => (
                <td key={column.key} className={cn('px-2 py-1.5', ALIGN[column.align ?? 'left'], column.className)} style={index === 0 ? indent(depth, CARET_REM) : undefined}>
                    {node.cells[column.key]}
                </td>
            ))}
        </tr>
    )
}

const ROWS = { group: GroupRow, branch: BranchRow, row: LeafRow }

function Nodes({ nodes, columns, depth, collapsed, onToggle }) {
    return nodes.map((node) => {
        const Row = ROWS[node.type ?? 'row']
        const isCollapsed = collapsed.has(node.id)
        const childDepth = node.type === 'group' ? depth : depth + 1

        return (
            <Fragment key={node.id}>
                <Row node={node} columns={columns} depth={depth} collapsed={isCollapsed} onToggle={onToggle} />
                {node.children?.length > 0 && !isCollapsed && <Nodes nodes={node.children} columns={columns} depth={childDepth} collapsed={collapsed} onToggle={onToggle} />}
            </Fragment>
        )
    })
}

/**
 * A table whose rows nest: `group` bands (full width, e.g. a division), collapsible `branch` rows
 * (full width with a right-hand `meta`, e.g. a manager; or, given `cells` and `span`, figures under the columns)
 * and `row` leaves with one cell per column. `footer` ({label, span, cells}) adds a total row under the body.
 * The caller owns `collapsed` (a Set of node ids) so it can expand or collapse everything at once.
 * Branch and row nodes may carry `onContextMenu` for a right-click menu (kit `ContextMenu`).
 */
export function TreeTable({ columns, nodes, collapsed = new Set(), onToggle = () => {}, empty = strings.noData, footer, flush = false, className }) {
    return (
        <div className={cn('overflow-x-auto overflow-y-hidden', !flush && 'rounded border border-zinc-200 bg-white', className)}>
            <table className="w-full border-collapse text-xs tabular-nums">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={cn(
                                    'sticky top-0 border-b border-zinc-200 bg-white px-2 py-1 text-[0.625rem] font-medium whitespace-nowrap text-zinc-500',
                                    ALIGN[column.align ?? 'left'],
                                    column.headerClassName,
                                )}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-zinc-800">
                    {nodes.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-2 py-6 text-center text-zinc-400">
                                {empty}
                            </td>
                        </tr>
                    ) : (
                        <Nodes nodes={nodes} columns={columns} depth={0} collapsed={collapsed} onToggle={onToggle} />
                    )}
                </tbody>
                {footer && nodes.length > 0 && (
                    <tfoot>
                        <CellsRow
                            node={footer}
                            columns={columns}
                            depth={0}
                            caret={<span className="size-5 shrink-0" />}
                            className="border-t-2 border-zinc-200 bg-zinc-50 font-semibold text-zinc-900"
                        />
                    </tfoot>
                )}
            </table>
        </div>
    )
}

/**
 * Every node id that has children, for "ย่อทั้งหมด".
 */
export function branchIds(nodes) {
    return nodes.flatMap((node) => (node.children?.length ? [node.id, ...branchIds(node.children)] : []))
}
