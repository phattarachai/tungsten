import { useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { usePersistentState } from '../../lib/usePersistentState'

const MIN_WIDTH = 320
const STEP = 24

function clamp(width) {
    return Math.min(Math.max(width, MIN_WIDTH), Math.max(MIN_WIDTH, Math.round(window.innerWidth * 0.7)))
}

/**
 * See docs/kernel.md — "The shell".
 */
export function useDockWidth(storageKey, defaultWidth) {
    const [saved, setSaved] = usePersistentState(storageKey, defaultWidth)
    const [live, setLive] = useState(null)
    const latest = useRef(null)

    function resize(next) {
        latest.current = next
        setLive(next)
    }

    function commit(next = latest.current) {
        if (next !== null) {
            setSaved(next)
        }

        latest.current = null
        setLive(null)
    }

    return { width: live ?? clamp(saved), dragging: live !== null, resize, commit }
}

export function DockResizeHandle({ dock, label }) {
    const pointer = useRef(null)

    function onPointerDown(event) {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        pointer.current = event.pointerId
        dock.resize(dock.width)
    }

    function onPointerMove(event) {
        if (pointer.current === event.pointerId) {
            dock.resize(clamp(window.innerWidth - event.clientX))
        }
    }

    function onPointerUp() {
        pointer.current = null
        dock.commit()
    }

    function onKeyDown(event) {
        const delta = { ArrowLeft: STEP, ArrowRight: -STEP }[event.key]

        if (delta) {
            event.preventDefault()
            dock.commit(clamp(dock.width + delta))
        }
    }

    return (
        <div
            role="separator"
            aria-orientation="vertical"
            aria-label={label}
            aria-valuenow={dock.width}
            aria-valuemin={MIN_WIDTH}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={onKeyDown}
            className="group absolute inset-y-0 -left-1 z-10 hidden w-2 cursor-col-resize touch-none outline-none md:block"
        >
            <span className={cn('mx-auto block h-full w-0.5 transition-colors group-hover:bg-zinc-300 group-focus-visible:bg-zinc-400', dock.dragging && 'bg-zinc-400')} />
            {dock.dragging && <span className="fixed inset-0 cursor-col-resize" />}
        </div>
    )
}
