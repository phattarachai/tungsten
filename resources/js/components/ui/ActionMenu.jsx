import { ChevronDown, MoreHorizontal } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../lib/cn'
import { popoverMotion } from '../../lib/motion'
import { strings } from '../../lib/strings'

const MENU_HEIGHT_GUESS = 160

function placement(rect) {
    const opensUp = rect.bottom + MENU_HEIGHT_GUESS > window.innerHeight

    return {
        right: window.innerWidth - rect.right,
        ...(opensUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    }
}

function useDismiss(open, button, panel, close) {
    useEffect(() => {
        if (!open) {
            return undefined
        }

        function onPointer(event) {
            if (!button.current?.contains(event.target) && !panel.current?.contains(event.target)) {
                close()
            }
        }

        function onKey(event) {
            if (event.key === 'Escape') {
                close()
            }
        }

        document.addEventListener('mousedown', onPointer)
        document.addEventListener('keydown', onKey)
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)

        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('keydown', onKey)
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [open, button, panel, close])
}

function MenuPanel({ items, position, panel, close }) {
    return createPortal(
        <div
            ref={panel}
            role="menu"
            style={{ position: 'fixed', ...position }}
            className={cn('z-50 min-w-40 rounded border border-zinc-200 bg-white py-1 text-left shadow-lg', popoverMotion(position))}
        >
            {items.map((item) => {
                if (item.heading) {
                    return (
                        <div key={`h-${item.heading}`} className="truncate px-2.5 pt-1.5 pb-0.5 text-[0.6875rem] font-semibold text-zinc-500 first:pt-0.5">
                            {item.heading}
                        </div>
                    )
                }

                const Icon = item.icon

                return (
                    <button
                        key={item.key ?? item.label}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            close()
                            item.onSelect()
                        }}
                        className={cn(
                            'flex w-full items-center gap-2 px-2.5 py-1.5 text-xs whitespace-nowrap',
                            item.tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-zinc-700 hover:bg-zinc-50',
                        )}
                    >
                        {Icon && <Icon className="size-3.5 shrink-0" />}
                        {item.label}
                        {item.hint !== undefined && <span className="ml-auto pl-4 text-[0.6875rem] text-zinc-400 tabular-nums">{item.hint}</span>}
                    </button>
                )
            })}
        </div>,
        document.body,
    )
}

/**
 * The same menu opened at the pointer by a right-click: pass `at` (`{x, y}` from the event) and
 * `onClose`. Items may include `{heading}` rows to group them, and `key` when labels repeat.
 */
export function ContextMenu({ at, items, onClose }) {
    const panel = useRef(null)
    const none = useRef(null)
    const position = at && { left: Math.min(at.x, window.innerWidth - 240), ...(at.y + MENU_HEIGHT_GUESS > window.innerHeight ? { bottom: window.innerHeight - at.y } : { top: at.y }) }

    useDismiss(Boolean(at), none, panel, onClose)

    return position ? <MenuPanel items={items} position={position} panel={panel} close={onClose} /> : null
}

/**
 * A ⋯ menu, or with `label` (and `icon`) a labelled outline button with a caret: one "เพิ่ม ▾" for several kinds of add.
 */
export function ActionMenu({ items, title = strings.actions, label, icon: TriggerIcon, iconClassName = 'text-brand' }) {
    const [position, setPosition] = useState(null)
    const button = useRef(null)
    const panel = useRef(null)
    const close = useCallback(() => setPosition(null), [])

    useDismiss(position !== null, button, panel, close)

    function toggle() {
        setPosition((current) => (current ? null : placement(button.current.getBoundingClientRect())))
    }

    return (
        <>
            <button
                ref={button}
                type="button"
                onClick={toggle}
                aria-haspopup="menu"
                aria-expanded={position !== null}
                aria-label={label ? undefined : title}
                className={
                    label
                        ? cn(
                              'inline-flex h-6 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 text-xs font-medium whitespace-nowrap text-zinc-700 hover:bg-zinc-50',
                              position && 'bg-zinc-50',
                          )
                        : cn('inline-flex size-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800', position && 'bg-zinc-100 text-zinc-800')
                }
            >
                {label ? (
                    <>
                        {TriggerIcon && <TriggerIcon className={cn('size-3.5', iconClassName)} />}
                        {label}
                        <ChevronDown className="size-3 text-zinc-400" />
                    </>
                ) : (
                    <MoreHorizontal className="size-4" />
                )}
            </button>
            {position && <MenuPanel items={items} position={position} panel={panel} close={close} />}
        </>
    )
}
