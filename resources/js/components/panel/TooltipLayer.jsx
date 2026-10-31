import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const GAP = 6
const SELECTOR = '[title], [data-tip]'

function tipOf(element) {
    const title = element.getAttribute('title')

    if (title) {
        element.dataset.tip = title
        element.removeAttribute('title')

        if (!element.hasAttribute('aria-label') && element.textContent.trim() === '') {
            element.setAttribute('aria-label', title)
        }
    }

    return element.dataset.tip
}

function placement(rect) {
    const above = rect.top > 40

    return {
        left: Math.min(Math.max(rect.left + rect.width / 2, 100), window.innerWidth - 100),
        ...(above ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
    }
}

export function TooltipLayer() {
    const [tip, setTip] = useState(null)

    useEffect(() => {
        let current = null

        function show(event) {
            const element = event.target instanceof Element ? event.target.closest(SELECTOR) : null

            if (!element || element === current || element.closest('svg title')) {
                return
            }

            const text = tipOf(element)

            current = element
            setTip(text ? { text, ...placement(element.getBoundingClientRect()) } : null)
        }

        function leave(event) {
            if (current && !current.contains(event.relatedTarget)) {
                current = null
                setTip(null)
            }
        }

        function hide() {
            current = null
            setTip(null)
        }

        document.addEventListener('mouseover', show)
        document.addEventListener('mouseout', leave)
        document.addEventListener('mousedown', hide)
        document.addEventListener('keydown', hide)
        window.addEventListener('scroll', hide, true)

        return () => {
            document.removeEventListener('mouseover', show)
            document.removeEventListener('mouseout', leave)
            document.removeEventListener('mousedown', hide)
            document.removeEventListener('keydown', hide)
            window.removeEventListener('scroll', hide, true)
        }
    }, [])

    if (!tip) {
        return null
    }

    return createPortal(
        <div
            role="tooltip"
            style={{ position: 'fixed', left: tip.left, top: tip.top, bottom: tip.bottom }}
            className="pointer-events-none z-70 max-w-xs -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-[0.6875rem] leading-snug whitespace-pre-line text-white shadow-lg"
        >
            {tip.text}
        </div>,
        document.body,
    )
}
