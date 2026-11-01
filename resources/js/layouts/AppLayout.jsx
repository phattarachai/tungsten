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
// Written out so Tailwind sees them; the keys are RouteMeta::WIDTHS.
const WIDTHS = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
}

/** The page's content, capped at `width` and left-aligned; the sheet or canvas around it keeps its full size. */
function Content({ width, children }) {
    return WIDTHS[width] ? <div className={cn('min-w-0', WIDTHS[width])}>{children}</div> : children
}

function Main({ sheet, gutter, top, flush, width, className, children }) {
    if (!sheet) {
        return (
            <main className={cn('panel-main min-w-0 flex-1', !flush && 'p-3 pb-24', className)}>
                <Content width={width}>{children}</Content>
            </main>
        )
    }

    return (
        <div className={cn('flex min-w-0 flex-1 pr-2 pb-2', gutter ? 'pl-2' : 'pl-2 md:pl-0', top && 'pt-2')}>
            <main className={cn('panel-main min-w-0 flex-1 rounded-lg border border-sheet-line bg-sheet', !flush && 'px-4 pt-3 pb-24', className)}>
                <Content width={width}>{children}</Content>
            </main>
        </div>
    )
}

/**
 * The panel shell: sidebar, topbar, `main`, the Aside slot, toasts and tooltips. A page opts in by setting it as its
 * layout (`Page.layout = (page) => <AppLayout>{page}</AppLayout>`) and can drop any part of it:
 *
 * - `flush` drops main's padding (a full-bleed tool page whose panes meet the chrome);
 * - `sheet` draws main as one rounded sheet (`--color-sheet`) inset in the chrome, down to the viewport bottom;
 * - `width` caps the page's content (`'4xl'`, `'5xl'`, `'7xl'` …, `'full'` by default), left-aligned, inside a
 *   full-size sheet: a short form stays at its width, a list uses the room (route: `->width('4xl')`);
 * - `sidebar={false}` / `topbar={false}` leave that part out;
 * - `className` / `mainClassName` restyle the frame.
 *
 * `Panel::layout([...])` and a route's `->layout([...])` (merged into the `layout` prop, the route winning) supply
 * defaults for these; JSX props win.
 * A page that wants none of it simply doesn't use AppLayout — the kit components work on their own.
 */
export function AppLayout({ children, toolbar, ...options }) {
    const { layout: routeLayout } = usePage().props
    const { flush = false, sheet = false, width = 'full', sidebar = true, topbar = true, className, mainClassName } = { ...(routeLayout ?? {}), ...options }
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
                            <Main sheet={sheet} gutter={!railOpen} top={!topbar} flush={flush} width={width} className={mainClassName}>
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
