import { createContext, use } from 'react'

export const HelpPanelContext = createContext(null)

export function useHelpPanel() {
    return use(HelpPanelContext)
}

export function opensInPanel(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

export function embedUrl(url) {
    const target = new URL(url, window.location.href)

    target.searchParams.set('embed', '1')
    target.searchParams.set('scheme', 'light')

    return target.pathname + target.search + target.hash
}
