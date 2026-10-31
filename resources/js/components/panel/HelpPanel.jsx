import { ExternalLink, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'

import { DockResizeHandle, useDockWidth } from './DockResize'
import { embedUrl } from './helpContext'
import { strings } from '../../lib/strings'

const DEFAULT_WIDTH = 480
const PAGE_MESSAGE = 'ai-docs:page'

function usePageReport(frame, url) {
    const [page, setPage] = useState({ title: null, url })

    useEffect(() => {
        function onMessage(event) {
            if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== PAGE_MESSAGE) {
                return
            }

            setPage({ title: event.data.title, url: event.data.url })
        }

        window.addEventListener('message', onMessage)

        return () => window.removeEventListener('message', onMessage)
    }, [frame])

    return page
}

/**
 * See docs/theme.md — "Motion".
 */
export function HelpPanel({ url, onClose }) {
    const dock = useDockWidth('panel-help-width', DEFAULT_WIDTH)

    return (
        <aside
            style={{ '--help-w': `${dock.width}px` }}
            className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md animate-panel-slide flex-col border-l border-zinc-200 bg-white shadow-xl md:sticky md:top-10 md:z-0 md:h-[calc(100vh-2.5rem)] md:w-(--help-w) md:max-w-none md:shrink-0 md:shadow-none"
        >
            <DockResizeHandle dock={dock} label={strings.resizeHelp} />
            <HelpFrame key={url} url={url} dragging={dock.dragging} onClose={onClose} />
        </aside>
    )
}

function HelpFrame({ url, dragging, onClose }) {
    const frame = useRef(null)
    const page = usePageReport(frame, url)

    return (
        <>
            <div className="flex h-9 shrink-0 items-center gap-1 border-b border-zinc-200 pr-2 pl-3">
                <h2 className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-800">{page.title ?? strings.help}</h2>
                <a href={page.url} target="_blank" rel="noopener" title={strings.openFull} aria-label={strings.openFull} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <ExternalLink className="size-3.5" />
                </a>
                <button type="button" onClick={onClose} aria-label={strings.close} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <X className="size-3.5" />
                </button>
            </div>
            <iframe ref={frame} src={embedUrl(url)} aria-label={strings.help} className={cn('min-h-0 w-full flex-1 border-0', dragging && 'pointer-events-none')} />
        </>
    )
}
