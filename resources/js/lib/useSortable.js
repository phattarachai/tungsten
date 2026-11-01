import { useEffect, useRef, useState } from 'react'

import { strings } from './strings'

function moved(list, from, to) {
    const next = [...list]
    const [item] = next.splice(from, 1)

    next.splice(to, 0, item)

    return next
}

/**
 * Reordering by dragging a row's handle (pointer events, so mouse, pen and touch alike) or by ↑ / ↓ on the focused
 * handle. Rows move live while dragging; `onReorder(items)` gets the new order once per drop and once per key move.
 * Spread `rowProps(item)` on each row and `handleProps(item, index)` on its handle button; `container` goes on the
 * list so hit-testing stays inside it.
 */
export function useSortable({ items, keyOf = (item) => item.id, onReorder, disabled = false }) {
    const [order, setOrder] = useState(items)
    const [dragging, setDragging] = useState(null)
    const container = useRef(null)
    const live = useRef(items)
    const changed = useRef(false)

    useEffect(() => {
        if (dragging === null) {
            setOrder(items)
            live.current = items
        }
    }, [items, dragging])

    const indexOf = (key) => live.current.findIndex((item) => String(keyOf(item)) === String(key))

    function move(from, to) {
        const next = moved(live.current, from, to)

        live.current = next
        setOrder(next)

        return next
    }

    function rowUnder(event) {
        const row = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-sortable-row]')

        return row && container.current?.contains(row) ? row.getAttribute('data-sortable-row') : null
    }

    function focusHandle(key) {
        const selector = `[data-sortable-handle="${String(key).replace(/["\\]/g, '\\$&')}"]`

        requestAnimationFrame(() => container.current?.querySelector(selector)?.focus())
    }

    function handleProps(item, index) {
        const key = String(keyOf(item))

        return {
            type: 'button',
            disabled,
            'data-sortable-handle': key,
            'aria-label': strings.moveItem(index + 1),
            style: { touchAction: 'none' },
            onPointerDown(event) {
                if (disabled || event.button !== 0) {
                    return
                }

                event.currentTarget.setPointerCapture?.(event.pointerId)
                changed.current = false
                setDragging(key)
            },
            onPointerMove(event) {
                if (dragging !== key) {
                    return
                }

                const over = rowUnder(event)
                const from = indexOf(key)
                const to = over === null ? -1 : indexOf(over)

                if (to >= 0 && to !== from) {
                    move(from, to)
                    changed.current = true
                }
            },
            onPointerUp() {
                if (dragging !== key) {
                    return
                }

                setDragging(null)

                if (changed.current) {
                    changed.current = false
                    onReorder(live.current)
                }
            },
            onPointerCancel() {
                setDragging(null)
            },
            onKeyDown(event) {
                const from = indexOf(key)
                const to = { ArrowUp: from - 1, ArrowDown: from + 1 }[event.key]

                if (disabled || to === undefined || to < 0 || to >= live.current.length) {
                    return
                }

                event.preventDefault()
                onReorder(move(from, to))
                focusHandle(key)
            },
        }
    }

    function rowProps(item) {
        return { 'data-sortable-row': String(keyOf(item)), 'data-dragging': dragging === String(keyOf(item)) || undefined }
    }

    return { order, dragging, container, handleProps, rowProps }
}
