import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../lib/cn'
import { inBrowser } from '../../lib/browser'
import { strings } from '../../lib/strings'

const LightboxContext = createContext(null)

const CONTROL = 'grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white'

/** Keeps Tab inside `root` and Escape / the arrows on the viewer while it is open; puts focus back on close. */
function useViewerKeys(root, { onClose, onStep }) {
    const handlers = useRef({ onClose, onStep })

    useEffect(() => {
        handlers.current = { onClose, onStep }
    })

    useEffect(() => {
        const opener = document.activeElement
        const { overflow } = document.body.style

        document.body.style.overflow = 'hidden'
        root.current?.querySelector('[data-lightbox-close]')?.focus()

        function onKey(event) {
            const keys = {
                Escape: () => handlers.current.onClose(),
                ArrowRight: () => handlers.current.onStep(1),
                ArrowLeft: () => handlers.current.onStep(-1),
            }

            if (keys[event.key]) {
                event.preventDefault()
                keys[event.key]()

                return
            }

            if (event.key === 'Tab') {
                const focusable = [...(root.current?.querySelectorAll('button') ?? [])]
                const at = focusable.indexOf(document.activeElement)
                const next = (at + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length

                event.preventDefault()
                focusable[next]?.focus()
            }
        }

        document.addEventListener('keydown', onKey)

        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = overflow
            opener?.focus?.()
        }
    }, [root])
}

/**
 * The full-screen viewer: one image of `images` (`{ src, full?, alt? }`, `full` being the large file when `src` is a
 * thumbnail) with its caption and "n / N"; arrows and buttons step through the group, Escape, the × or a click
 * outside the image closes it.
 */
function LightboxView({ images, index, onStep, onClose }) {
    const root = useRef(null)
    const image = images[index]
    const many = images.length > 1

    useViewerKeys(root, { onClose, onStep })

    const stop = (action) => (event) => {
        event.stopPropagation()
        action()
    }

    return createPortal(
        <div
            ref={root}
            role="dialog"
            aria-modal="true"
            aria-label={image.alt || strings.image}
            onClick={onClose}
            className="fixed inset-0 z-[60] flex animate-panel-fade flex-col items-center justify-center gap-3 bg-zinc-950/85 p-6 text-white"
        >
            <button type="button" data-lightbox-close onClick={stop(onClose)} aria-label={strings.close} className={cn(CONTROL, 'absolute top-4 right-4 size-9')}>
                <X className="size-5" />
            </button>
            {many && (
                <>
                    <button type="button" onClick={stop(() => onStep(-1))} aria-label={strings.previousImage} className={cn(CONTROL, 'absolute left-4 size-10')}>
                        <ChevronLeft className="size-6" />
                    </button>
                    <button type="button" onClick={stop(() => onStep(1))} aria-label={strings.nextImage} className={cn(CONTROL, 'absolute right-4 size-10')}>
                        <ChevronRight className="size-6" />
                    </button>
                </>
            )}
            <img src={image.full ?? image.src} alt={image.alt ?? ''} onClick={(event) => event.stopPropagation()} className="max-h-[85vh] max-w-[90vw] rounded bg-white object-contain" />
            {(image.alt || many) && (
                <p className="text-center text-[0.8125rem] text-white/80">
                    {image.alt}
                    {many && <span className="ml-2 text-white/50 tabular-nums">{`${index + 1} / ${images.length}`}</span>}
                </p>
            )}
        </div>,
        document.body,
    )
}

function useViewer() {
    const [view, setView] = useState(null)
    const open = useCallback((images, index = 0) => setView({ images, index }), [])
    const close = useCallback(() => setView(null), [])
    const step = useCallback((by) => setView((current) => current && { ...current, index: (current.index + by + current.images.length) % current.images.length }), [])
    const viewer = view && inBrowser ? <LightboxView images={view.images} index={view.index} onStep={step} onClose={close} /> : null

    return { open, viewer }
}

/**
 * One shared viewer for a page; AppLayout already provides it. Images open it through `Zoomable`, a `Thumb` /
 * `Avatar` with `zoom`, or `useLightbox()(images, index)`.
 */
export function LightboxProvider({ children }) {
    const { open, viewer } = useViewer()

    return (
        <LightboxContext value={open}>
            {children}
            {viewer}
        </LightboxContext>
    )
}

/** `open(images, index)` of the nearest LightboxProvider, or null outside one. */
export function useLightbox() {
    return useContext(LightboxContext)
}

/**
 * Makes `children` (a thumbnail) open the viewer: `images` is its group and `index` its place, or `src` / `full` /
 * `alt` for a single image. Without a LightboxProvider above it, it brings its own viewer. With no image to show it
 * renders `children` as they are.
 */
export function Zoomable({ images, index = 0, src, full, alt, className, children }) {
    const shared = useContext(LightboxContext)
    const own = useViewer()
    const group = images ?? (src ? [{ src, full, alt }] : [])
    const open = shared ?? own.open

    if (!group[index]?.src) {
        return children
    }

    return (
        <>
            <button
                type="button"
                onClick={() => open(group, index)}
                aria-label={strings.viewImage(group[index].alt)}
                className={cn('inline-flex shrink-0 cursor-zoom-in rounded focus-visible:outline-2 focus-visible:outline-brand', className)}
            >
                {children}
            </button>
            {!shared && own.viewer}
        </>
    )
}
