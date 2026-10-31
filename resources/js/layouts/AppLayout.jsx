import { usePage } from '@inertiajs/react'
import { useMemo, useState } from 'react'

import { AsideTarget } from '../components/panel/asideTarget'
import { FlashToast } from '../components/panel/FlashToast'
import { HelpPanel } from '../components/panel/HelpPanel'
import { HelpPanelContext } from '../components/panel/helpContext'
import { Sidebar } from '../components/panel/Sidebar'
import { TooltipLayer } from '../components/panel/TooltipLayer'
import { Topbar } from '../components/panel/Topbar'
import { cn } from '../lib/cn'

const STORAGE_KEY = 'panel-sidebar-closed'

function readClosed() {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
        return false
    }
}

function writeClosed(closed) {
    try {
        localStorage.setItem(STORAGE_KEY, closed ? '1' : '0')
    } catch {
        // storage unavailable — the toggle still works for this page
    }
}

/**
 * The handbook pane: the Topbar `?` opens the current page's help (`panel.help`), a `HelpLink` opens its own topic.
 */
function useHelp() {
    const { panel } = usePage().props
    const [shown, setShown] = useState(null)
    const url = shown?.followPage ? panel.help : (shown?.url ?? null)

    const actions = useMemo(
        () => ({
            open: (topic) => setShown({ url: topic, followPage: false }),
            togglePage: () => setShown((current) => (current ? null : { url: null, followPage: true })),
            close: () => setShown(null),
        }),
        [],
    )

    return useMemo(() => ({ ...actions, url, isOpen: url !== null }), [actions, url])
}

/**
 * The panel shell: sidebar, topbar, `main`, the Aside slot, toasts and tooltips. A page sets it as its layout:
 * `Page.layout = (page) => <AppLayout>{page}</AppLayout>`. `flush` drops main's padding for a full-bleed tool page
 * whose own panes meet the sidebar and topbar.
 */
export function AppLayout({ toolbar, flush = false, children }) {
    const [closed, setClosed] = useState(readClosed)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [asideTarget, setAsideTarget] = useState(null)
    const help = useHelp()

    function toggle() {
        if (window.matchMedia('(min-width: 768px)').matches) {
            setClosed((previous) => {
                writeClosed(!previous)

                return !previous
            })

            return
        }

        setMobileOpen((previous) => !previous)
    }

    return (
        <HelpPanelContext value={help}>
            <div className="panel-shell min-h-screen bg-zinc-100 text-xs text-zinc-800">
                <Sidebar closed={closed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
                <div className={cn('transition-all', !closed && 'md:ml-50')}>
                    <Topbar sidebarClosed={closed} onToggleSidebar={toggle} toolbar={toolbar} />
                    <div className="flex items-start">
                        <main className={cn('panel-main min-w-0 flex-1', !flush && 'p-3 pb-24')}>
                            <AsideTarget value={asideTarget}>{children}</AsideTarget>
                        </main>
                        <div ref={setAsideTarget} className="contents" />
                        {help.url && <HelpPanel url={help.url} onClose={help.close} />}
                    </div>
                </div>
                <FlashToast />
                <TooltipLayer />
            </div>
        </HelpPanelContext>
    )
}
