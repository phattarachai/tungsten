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
 *
 * The drag listens on `window` from pointerdown to pointerup: a live move re-inserts the row, which drops any pointer
 * capture on its handle, so listeners on the handle would miss the drop.
 */
export function useSortable({ items, keyOf = (item) => item.id, onReorder, disabled = false }) {
    const [order, setOrder] = useState(items)
    const [dragging, setDragging] = useState(null)
    const container = useRef(null)
    const live = useRef(items)
    const latest = useRef({ items, onReorder })
    const stopDrag = useRef(null)

    useEffect(() => {
        latest.current = { items, onReorder }
    })

    useEffect(() => {
        if (dragging === null) {
            setOrder(items)
            live.current = items
        }
    }, [items, dragging])

    useEffect(() => () => stopDrag.current?.(false), [])

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

    /** Follows the pointer on `window` until it's released (report the order) or cancelled (put it back). */
    function startDrag(key) {
        let changed = false
        const { userSelect } = document.body.style

        function onMove(event) {
            const over = rowUnder(event)
            const from = indexOf(key)
            const to = over === null ? -1 : indexOf(over)

            if (to >= 0 && to !== from) {
                move(from, to)
                changed = true
            }
        }

        function stop(drop) {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onCancel)
            document.body.style.userSelect = userSelect
            stopDrag.current = null
            setDragging(null)

            if (drop && changed) {
                latest.current.onReorder(live.current)

                return
            }

            if (changed) {
                live.current = latest.current.items
                setOrder(latest.current.items)
            }
        }

        const onUp = () => stop(true)
        const onCancel = () => stop(false)

        stopDrag.current?.(false)
        stopDrag.current = stop
        document.body.style.userSelect = 'none'
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onCancel)
        setDragging(key)
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

                event.preventDefault()
                event.currentTarget.focus()
                startDrag(key)
            },
            onKeyDown(event) {
                const from = indexOf(key)
                const to = { ArrowUp: from - 1, ArrowDown: from + 1 }[event.key]

                if (disabled || to === undefined || to < 0 || to >= live.current.length) {
                    return
                }

                event.preventDefault()
                latest.current.onReorder(move(from, to))
                focusHandle(key)
            },
        }
    }

    function rowProps(item) {
        return { 'data-sortable-row': String(keyOf(item)), 'data-dragging': dragging === String(keyOf(item)) || undefined }
    }

    return { order, dragging, container, handleProps, rowProps }
}
