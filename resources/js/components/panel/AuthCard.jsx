import { Head, Link, usePage } from '@inertiajs/react'

import { BrandLabel } from './EnvLine'
import { PanelChip } from './PanelChip'
import { cn } from '../../lib/cn'
import { urlOf } from '../../lib/href'

function Brand({ panel }) {
    const brand = panel?.brand

    return (
        <div className="mb-4 flex items-center justify-center gap-2">
            <PanelChip entry={{ color: panel?.color, short: panel?.short, icon: brand?.icon ?? panel?.icon, logo: brand?.logo }} className="size-7 text-[0.6875rem]" />
            <BrandLabel label={brand?.label ?? panel?.label} env={panel?.env} className="text-[0.9375rem] font-semibold text-zinc-900" />
            {brand?.tag && <span className="rounded bg-zinc-200 px-1 text-[0.625rem] leading-4 font-semibold text-zinc-500">{brand.tag}</span>}
        </div>
    )
}

/**
 * The frame of the panel's sign-in pages (login, forgot / reset password, two-factor): the brand above one card on the
 * canvas, the title and intro at the card's head, the flashed `status` under them. `footer` sits under the card.
 */
export function AuthCard({ title, intro, onSubmit, footer, width = 'max-w-xs', children }) {
    const { panel, flash } = usePage().props
    const Body = onSubmit ? 'form' : 'div'

    return (
        <div className="panel-shell flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10 text-xs text-zinc-800">
            <Head title={title} />
            <div className={cn('w-full', width)}>
                <Brand panel={panel} />
                <Body onSubmit={onSubmit} className="space-y-3 rounded-lg border border-sheet-line bg-sheet p-5 shadow-sm" noValidate={onSubmit ? true : undefined}>
                    <div className="space-y-1">
                        <h1 className="text-[0.9375rem] font-semibold text-zinc-900">{title}</h1>
                        {intro && <p className="text-zinc-500">{intro}</p>}
                    </div>
                    {flash?.status && <p className="rounded-md bg-zinc-100 px-3 py-2 text-zinc-700">{flash.status}</p>}
                    {children}
                </Body>
                {footer && <div className="mt-3 text-center text-zinc-500">{footer}</div>}
            </div>
        </div>
    )
}

/** A quiet text link under or inside an auth card; `method="post"` makes it a button that posts (sign out). */
export function AuthLink({ href, method, onClick, children }) {
    const className = 'text-zinc-500 hover:text-brand hover:underline'

    if (href && method === 'post') {
        return (
            <Link href={urlOf(href)} method="post" as="button" className={className}>
                {children}
            </Link>
        )
    }

    return href ? (
        <a href={href} className={className}>
            {children}
        </a>
    ) : (
        <button type="button" onClick={onClick} className={className}>
            {children}
        </button>
    )
}
