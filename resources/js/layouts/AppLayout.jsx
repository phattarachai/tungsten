import { usePage } from '@inertiajs/react'
import { useMemo, useState } from 'react'

import { AsideTarget } from '../components/panel/asideTarget'
import { FlashToast } from '../components/panel/FlashToast'
import { HelpPanel } from '../components/panel/HelpPanel'
import { HelpPanelContext } from '../components/panel/helpContext'
import { LightboxProvider } from '../components/ui/Lightbox'
import { Sidebar } from '../components/panel/Sidebar'
import { TooltipLayer } from '../components/panel/TooltipLayer'
import { Topbar } from '../components/panel/Topbar'
import { cn } from '../lib/cn'
import { usePersistentState } from '../lib/usePersistentState'

/**
 * The handbook pane: the Topbar `?` opens the current page's help (`panel.help`), a `HelpLink` opens its own topic.
 */
function useHelp() {
    const { panel } = usePage().props
    const [shown, setShown] = useState(null)
    const url = shown?.followPage ? panel?.help : (shown?.url ?? null)

    const actions = useMemo(
        () => ({
            open: (topic) => setShown({ url: topic, followPage: false }),
            togglePage: () => setShown((current) => (current ? null : { url: null, followPage: true })),
            close: () => setShown(null),
        }),
        [],
    )

    return useMemo(() => ({ ...actions, url: url ?? null, isOpen: Boolean(url) }), [actions, url])
}

/**
 * `main`, or in `sheet` mode `main` as a rounded sheet inset 0.5rem from the chrome's right and bottom. The rail's
 * own padding is the gap on the left, so the sheet takes a left inset only when the rail is closed or hidden, and a
 * top inset only when there is no topbar.
 */
function Main({ sheet, gutter, top, flush, className, children }) {
    if (!sheet) {
        return <main className={cn('panel-main min-w-0 flex-1', !flush && 'p-3 pb-24', className)}>{children}</main>
    }

    return (
        <div className={cn('flex min-w-0 flex-1 pr-2 pb-2', gutter ? 'pl-2' : 'pl-2 md:pl-0', top && 'pt-2')}>
            <main className={cn('panel-main min-w-0 flex-1 rounded-lg border border-sheet-line bg-sheet', !flush && 'px-4 pt-3 pb-24', className)}>{children}</main>
        </div>
    )
}

/**
 * The panel shell: sidebar, topbar, `main`, the Aside slot, toasts and tooltips. A page opts in by setting it as its
 * layout (`Page.layout = (page) => <AppLayout>{page}</AppLayout>`) and can drop any part of it:
 *
 * - `flush` drops main's padding (a full-bleed tool page whose panes meet the chrome);
 * - `sheet` draws main as one rounded sheet (`--color-sheet`) inset in the chrome, down to the viewport bottom;
 * - `sidebar={false}` / `topbar={false}` leave that part out;
 * - `className` / `mainClassName` restyle the frame.
 *
 * `Panel::layout([...])` and a route's `->layout([...])` (merged into the `layout` prop, the route winning) supply
 * defaults for these; JSX props win.
 * A page that wants none of it simply doesn't use AppLayout — the kit components work on their own.
 */
export function AppLayout({ children, toolbar, ...options }) {
    const { layout: routeLayout } = usePage().props
    const { flush = false, sheet = false, sidebar = true, topbar = true, className, mainClassName } = { ...(routeLayout ?? {}), ...options }
    const [closed, setClosed] = usePersistentState('panel-sidebar-closed', false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [asideTarget, setAsideTarget] = useState(null)
    const help = useHelp()
    const railOpen = sidebar && !closed

    function toggle() {
        if (window.matchMedia('(min-width: 768px)').matches) {
            setClosed(!closed)

            return
        }

        setMobileOpen((previous) => !previous)
    }

    return (
        <HelpPanelContext value={help}>
            <LightboxProvider>
                <div className={cn('panel-shell min-h-screen bg-zinc-100 text-xs text-zinc-800', className)}>
                    {sidebar && <Sidebar closed={closed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />}
                    <div className={cn('transition-all', railOpen && 'md:ml-50', sheet && 'flex min-h-screen flex-col')}>
                        {topbar && <Topbar sidebarClosed={!railOpen} onToggleSidebar={sidebar ? toggle : undefined} toolbar={toolbar} />}
                        <div className={cn('flex', sheet ? 'flex-1 items-stretch' : 'items-start')}>
                            <Main sheet={sheet} gutter={!railOpen} top={!topbar} flush={flush} className={mainClassName}>
                                <AsideTarget value={asideTarget}>{children}</AsideTarget>
                            </Main>
                            <div ref={setAsideTarget} className="contents" />
                            {help.url && <HelpPanel url={help.url} onClose={help.close} />}
                        </div>
                    </div>
                    <FlashToast />
                    <TooltipLayer />
                </div>
            </LightboxProvider>
        </HelpPanelContext>
    )
}
