import { X } from 'lucide-react'
import { use } from 'react'
import { createPortal } from 'react-dom'

import { AsideTarget } from './asideTarget'
import { DockResizeHandle, useDockWidth } from './DockResize'
import { strings } from '../../lib/strings'

export function Aside({ open, title, actions, onClose, widthKey = 'panel-aside-width', defaultWidth = 320, children }) {
    const target = use(AsideTarget)
    const dock = useDockWidth(widthKey, defaultWidth)

    if (!open || !target) {
        return null
    }

    return createPortal(
        <aside
            style={{ '--aside-w': `${dock.width}px` }}
            className="fixed inset-y-0 right-0 z-30 flex w-full max-w-sm animate-panel-slide flex-col border-l border-zinc-200 bg-white shadow-xl md:sticky md:top-10 md:z-0 md:h-[calc(100vh-2.5rem)] md:w-(--aside-w) md:max-w-none md:shrink-0 md:shadow-none"
        >
            <DockResizeHandle dock={dock} label={strings.resize(title)} />
            <div className="flex h-9 shrink-0 items-center gap-1 border-b border-zinc-200 pr-2 pl-3">
                <h2 className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-800">{title}</h2>
                {actions}
                <button type="button" onClick={onClose} aria-label={strings.close} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <X className="size-3.5" />
                </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </aside>,
        target,
    )
}
