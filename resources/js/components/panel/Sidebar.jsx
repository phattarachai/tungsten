import { Link, usePage } from '@inertiajs/react'
import { ArrowUpRight, ChevronDown } from 'lucide-react'

import { Icon } from '../ui/Icon'
import { cn } from '../../lib/cn'
import { useCollapsedGroups } from '../../lib/useCollapsedGroups'

import { PanelSwitcher } from './PanelSwitcher'
import { strings } from '../../lib/strings'
import { linkProps, urlOf } from '../../lib/href'

function NavItem({ item }) {
    const className = cn(
        'flex h-7 items-center gap-2 rounded-md px-2 text-xs transition',
        item.active ? 'bg-rail-active font-semibold text-rail-ink-active' : 'text-rail-ink hover:bg-rail-hover hover:text-rail-ink-active',
    )

    const body = (
        <>
            {item.legacy ? (
                <span className="flex size-3.5 shrink-0 items-center justify-center" aria-hidden="true">
                    <span className="size-1 rounded-full bg-rail-muted" />
                </span>
            ) : (
                <Icon name={item.icon} className={cn('size-3.5', item.active && 'text-brand-400')} />
            )}
            <span className="truncate">{item.label}</span>
            {item.badge && <span className="ml-auto rounded bg-rail-active px-1.5 text-[0.6875rem] text-rail-ink">{item.badge}</span>}
            {(item.external || item.legacy) && <ArrowUpRight className="ml-auto size-3 shrink-0 text-rail-muted" />}
        </>
    )

    if (item.legacy) {
        return (
            <a href={urlOf(item.url)} title={strings.legacyLink(item.label)} className={className}>
                {body}
            </a>
        )
    }

    if (item.external) {
        return (
            <a href={urlOf(item.url)} target="_blank" rel="noopener" className={className}>
                {body}
            </a>
        )
    }

    return (
        <Link {...linkProps(item.url)} prefetch className={className}>
            {body}
        </Link>
    )
}

function NavGroup({ section, collapsed, onToggle }) {
    return (
        <div className="space-y-px">
            {section.group && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation()
                        onToggle()
                    }}
                    aria-expanded={!collapsed}
                    className="flex w-full items-center rounded px-2 pb-0.5 pt-1 text-[0.625rem] font-semibold uppercase tracking-wide text-rail-muted hover:text-rail-ink"
                >
                    {section.group}
                    <ChevronDown className={cn('ml-auto size-3 transition-transform', collapsed && '-rotate-90')} />
                </button>
            )}
            {!collapsed && section.items.map((item) => <NavItem key={urlOf(item.url)} item={item} />)}
        </div>
    )
}

/**
 * The panel's nav: ungrouped entries first with no heading, then the groups (each folds; see `useCollapsedGroups`),
 * and the `pinned: 'bottom'` entries at the foot, apart from the groups.
 */
export function Sidebar({ closed, mobileOpen, onClose }) {
    const page = usePage()
    const { nav = [], panel } = page.props
    const groups = useCollapsedGroups(panel?.id ?? 'panel', nav, page.url)
    const listed = nav.filter((section) => section.pinned !== 'bottom')
    const bottom = nav.find((section) => section.pinned === 'bottom')

    return (
        <>
            <div className={cn('fixed inset-0 z-30 bg-zinc-900/40 transition-opacity md:hidden', mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={onClose} aria-hidden="true" />
            <aside
                className={cn(
                    'panel-rail panel-sidebar fixed inset-y-0 left-0 z-40 flex w-50 flex-col bg-rail transition-transform',
                    panel?.rail && 'panel-rail-tinted',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    !closed && 'md:translate-x-0',
                )}
                style={panel?.rail ? { '--color-rail': panel.rail } : undefined}
            >
                <div className="flex h-10 items-center border-b border-rail-line px-1.5">
                    <PanelSwitcher />
                </div>

                <nav className="flex-1 space-y-3 overflow-y-auto p-1.5" onClick={onClose}>
                    {listed.map((section, index) => (
                        <NavGroup key={section.group ?? `group-${index}`} section={section} collapsed={groups.isCollapsed(section)} onToggle={() => groups.toggle(section)} />
                    ))}
                </nav>
                {bottom && (
                    <nav className="space-y-px border-t border-rail-line p-1.5" onClick={onClose} aria-label={strings.pinnedNav}>
                        {bottom.items.map((item) => (
                            <NavItem key={urlOf(item.url)} item={item} />
                        ))}
                    </nav>
                )}
            </aside>
        </>
    )
}
