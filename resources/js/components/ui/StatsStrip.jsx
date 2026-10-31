import { Link } from '@inertiajs/react'

import { cn } from '../../lib/cn'
import { linkProps } from '../../lib/href'
import { TONE_INK } from '../../lib/tones'

function Figure({ stat }) {
    return (
        <>
            <div className="text-[0.75rem] text-zinc-500">{stat.label}</div>
            <div className={cn('mt-0.5 text-lg leading-tight font-semibold tabular-nums', TONE_INK[stat.tone] ?? 'text-zinc-900')}>{stat.value ?? <span className="text-zinc-300">—</span>}</div>
            {stat.hint && <div className="text-[0.6875rem] text-zinc-400">{stat.hint}</div>}
        </>
    )
}

/**
 * A row of figures in the sheet (Filament's stats widget), hairlines between them, as many columns as the container
 * fits (2, then 3 from `@2xl`, 6 from `@5xl`). A stat is `{ label, value, hint?, tone?, href? }`: `tone` is a status
 * tone that colours the value, `href` (a string or `{url, method}`) makes the cell a link.
 */
export function StatsStrip({ stats, className, gridClassName }) {
    return (
        <div className={cn('@container', className)}>
            <div className={cn('grid grid-cols-2 gap-px border-y border-zinc-100 bg-zinc-100 @2xl:grid-cols-3 @5xl:grid-cols-6', gridClassName)}>
                {stats.filter(Boolean).map((stat) =>
                    stat.href ? (
                        <Link key={stat.label} {...linkProps(stat.href)} className="block bg-sheet px-3 py-2.5 hover:bg-zinc-50">
                            <Figure stat={stat} />
                        </Link>
                    ) : (
                        <div key={stat.label} className="bg-sheet px-3 py-2.5">
                            <Figure stat={stat} />
                        </div>
                    ),
                )}
            </div>
        </div>
    )
}
