import { Link, usePage } from '@inertiajs/react'
import { ChevronDown, CircleHelp, PanelLeft } from 'lucide-react'

import { cn } from '../../lib/cn'

import { opensInPanel, useHelpPanel } from './helpContext'
import { PanelSwitcher } from './PanelSwitcher'
import { strings } from '../../lib/strings'
import { linkProps, urlOf } from '../../lib/href'

function EnvChip({ environment }) {
    if (!environment || environment === 'production') {
        return null
    }

    return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">{environment}</span>
}

function Breadcrumbs({ items }) {
    if (!items || items.length === 0) {
        return null
    }

    return (
        <nav className="hidden items-center gap-1.5 text-xs text-zinc-400 md:flex">
            {items.map((item, index) => (
                <span key={item.label} className="flex items-center gap-1.5">
                    {index > 0 && <span className="text-zinc-300">/</span>}
                    {item.url ? (
                        <Link href={urlOf(item.url)} prefetch className="hover:text-zinc-700">
                            {item.label}
                        </Link>
                    ) : (
                        <span className={index === items.length - 1 ? 'text-zinc-700' : undefined}>{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    )
}

function UserMenu({ user }) {
    return (
        <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-zinc-100">
                <span className="flex size-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600">{user.name?.charAt(0)?.toUpperCase()}</span>
                <ChevronDown className="size-3.5 text-zinc-400" />
            </summary>
            <div className="absolute right-0 z-40 mt-1 w-52 group-open:animate-panel-drop overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
                <div className="border-b border-zinc-100 px-3 py-2">
                    <p className="truncate text-[0.8125rem] font-medium text-zinc-900">{user.name}</p>
                    <p className="truncate text-xs text-zinc-400">{user.email}</p>
                </div>
                {user.logoutUrl && (
                    <Link {...linkProps(user.logoutUrl, 'post')} as="button" className="block w-full px-3 py-2 text-left text-[0.8125rem] text-zinc-700 hover:bg-zinc-50">
                        {strings.signOut}
                    </Link>
                )}
            </div>
        </details>
    )
}

function HelpButton({ url }) {
    const help = useHelpPanel()

    if (!url) {
        return null
    }

    function onClick(event) {
        if (help && opensInPanel(event)) {
            event.preventDefault()
            help.togglePage()
        }
    }

    return (
        <a
            href={urlOf(url)}
            target="_blank"
            rel="noopener"
            onClick={onClick}
            aria-label={strings.helpForPage}
            className={cn('rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800', help?.isOpen && 'bg-zinc-100 text-zinc-900')}
        >
            <CircleHelp className="size-4" />
        </a>
    )
}

/**
 * `search` is the slot a global search trigger takes (Tungsten v0.3); `toolbar` holds a page's own topbar controls.
 */
export function Topbar({ sidebarClosed, onToggleSidebar, toolbar, search }) {
    const { auth, panel, breadcrumbs } = usePage().props

    if (!panel) {
        return null
    }


    return (
        <header className="panel-topbar sticky top-0 z-20 flex h-10 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3">
            <div className="flex min-w-0 items-center gap-2">
                {onToggleSidebar && (
                    <button type="button" onClick={onToggleSidebar} className="rounded p-1 text-zinc-500 hover:bg-zinc-100" aria-label={strings.toggleSidebar}>
                        <PanelLeft className="size-4" />
                    </button>
                )}
                <EnvChip environment={panel.environment} />
                <div className={cn(!sidebarClosed && 'md:hidden')}>
                    <PanelSwitcher compact />
                </div>
                <Breadcrumbs items={breadcrumbs} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {search}
                {toolbar}
                <HelpButton url={panel.help} />
                {auth?.user && <UserMenu user={{ ...auth.user, logoutUrl: auth.logoutUrl }} />}
            </div>
        </header>
    )
}
