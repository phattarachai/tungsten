import { Link } from '@inertiajs/react'

import { cn } from '../../lib/cn'

import { Badge } from './Badge'
import { strings } from '../../lib/strings'

function ItemContent({ item }) {
    return (
        <>
            <span className="truncate" title={item.label}>
                {item.label}
            </span>
            {item.meta && <span className="shrink-0 text-[0.6875rem] font-normal text-zinc-400">{item.meta}</span>}
            {item.badge && (
                <Badge tone={item.badge.tone} className="shrink-0">
                    {item.badge.label}
                </Badge>
            )}
        </>
    )
}

export function NavList({ items, linkProps, empty = strings.noItems }) {
    if (items.length === 0) {
        return <p className="p-4 text-center text-zinc-400">{empty}</p>
    }

    return (
        <nav className="py-1">
            {items.map((item) => {
                const className = cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[0.8125rem]',
                    item.active ? 'bg-zinc-100 font-semibold text-zinc-900 shadow-[inset_2px_0_0_var(--color-brand)]' : 'text-zinc-700 hover:bg-zinc-50',
                )
                const content = <ItemContent item={item} />

                return item.onSelect ? (
                    <button key={item.key} type="button" aria-pressed={item.active} onClick={item.onSelect} className={className}>
                        {content}
                    </button>
                ) : (
                    <Link key={item.key} href={item.href} prefetch={item.prefetch ?? true} {...linkProps} className={className}>
                        {content}
                    </Link>
                )
            })}
        </nav>
    )
}
