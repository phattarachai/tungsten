import { createContext, use } from 'react'

export const HelpPanelContext = createContext(null)

export function useHelpPanel() {
    return use(HelpPanelContext)
}

export function opensInPanel(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

export function embedUrl(url) {
    const absolute = /^https?:\/\//.test(url)
    const target = new URL(url, 'http://tungsten.local')

    target.searchParams.set('embed', '1')
    target.searchParams.set('scheme', 'light')

    return absolute ? target.href : target.pathname + target.search + target.hash
}
